import type { ClientRoomAssetKind } from "@/lib/client-rooms/types";

interface UploadedPart {
  partNumber: number;
  etag: string;
}

interface MultipartInitResponse {
  uploadId: string;
  key: string;
  partSize: number;
}

interface MultipartUploadOptions {
  projectId: string;
  kind: ClientRoomAssetKind;
  file: File;
  onProgress?: (progress: number) => void;
}

interface MultipartUploadSession {
  version: 1;
  projectId: string;
  kind: ClientRoomAssetKind;
  fileName: string;
  fileSize: number;
  fileType: string;
  lastModified: number;
  uploadId: string;
  objectKey: string;
  partSize: number;
  uploadedParts: UploadedPart[];
  updatedAt: string;
}

const defaultPartSize = 10 * 1024 * 1024;
const maxRetries = 5;
const partUploadTimeoutMs = 120_000;
const multipartSessionPrefix = "client-room-upload-session";
const staleUploadMarkers = [
  "no such upload",
  "upload does not exist",
  "invalid upload key",
  "upload aborted",
  "invalid multipart",
];

export async function uploadClientRoomAssetMultipart({
  projectId,
  kind,
  file,
  onProgress,
}: MultipartUploadOptions) {
  if (file.size === 0) {
    throw new Error("File is empty");
  }

  return uploadClientRoomAssetMultipartAttempt(
    {
      projectId,
      kind,
      file,
      onProgress,
    },
    true,
  );
}

async function uploadClientRoomAssetMultipartAttempt(
  { projectId, kind, file, onProgress }: MultipartUploadOptions,
  allowReset: boolean,
) {
  const sessionKey = buildMultipartSessionKey(projectId, kind, file);
  const mimeType = file.type || "application/octet-stream";
  let session: MultipartUploadSession =
    readMultipartUploadSession(sessionKey, {
      projectId,
      kind,
      file,
    }) ??
    (await createMultipartUploadSession({
      projectId,
      kind,
      file,
      mimeType,
    }));

  writeMultipartUploadSession(sessionKey, session);

  const partSize = session.partSize || defaultPartSize;
  const totalParts = Math.ceil(file.size / partSize);
  let uploadedParts = mergeUploadedParts(session.uploadedParts);
  let uploadedBytes = getUploadedBytes(file.size, partSize, uploadedParts);

  onProgress?.(calculateUploadProgress(uploadedBytes, file.size));

  try {
    for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
      if (uploadedParts.some((part) => part.partNumber === partNumber)) {
        continue;
      }

      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);

      const part = await uploadMultipartPartWithRetry({
        projectId,
        uploadId: session.uploadId,
        objectKey: session.objectKey,
        partNumber,
        chunk,
      });

      uploadedParts = mergeUploadedParts([...uploadedParts, part]);
      uploadedBytes = getUploadedBytes(file.size, partSize, uploadedParts);
      session = {
        ...session,
        version: 1,
        uploadedParts,
        updatedAt: new Date().toISOString(),
      };
      writeMultipartUploadSession(sessionKey, session);
      onProgress?.(calculateUploadProgress(uploadedBytes, file.size));
    }

    const completeResponse = await fetch(
      `/api/client-rooms/projects/${projectId}/assets/multipart/complete`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          kind,
          fileName: file.name,
          mimeType,
          key: session.objectKey,
          uploadId: session.uploadId,
          parts: uploadedParts,
        }),
      },
    );
    const completeData = (await completeResponse.json()) as {
      error?: string;
      url?: string;
    };

    if (!completeResponse.ok || !completeData.url) {
      throw new Error(completeData.error || "Failed to finalize multipart upload");
    }

    clearMultipartUploadSession(sessionKey);
    onProgress?.(100);
    return completeData.url;
  } catch (error) {
    if (allowReset && isStaleMultipartUploadError(error)) {
      clearMultipartUploadSession(sessionKey);
      await abortMultipartUpload(projectId, session.uploadId, session.objectKey);

      return uploadClientRoomAssetMultipartAttempt(
        {
          projectId,
          kind,
          file,
          onProgress,
        },
        false,
      );
    }

    throw error instanceof Error ? error : new Error("Multipart upload failed");
  }
}

async function createMultipartUploadSession(input: {
  projectId: string;
  kind: ClientRoomAssetKind;
  file: File;
  mimeType: string;
}): Promise<MultipartUploadSession> {
  const initResponse = await fetch(`/api/client-rooms/projects/${input.projectId}/assets/multipart`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      kind: input.kind,
      fileName: input.file.name,
      mimeType: input.mimeType,
    }),
  });
  const initData = (await initResponse.json()) as {
    error?: string;
  } & Partial<MultipartInitResponse>;

  if (!initResponse.ok || !initData.uploadId || !initData.key) {
    throw new Error(initData.error || "Failed to start multipart upload");
  }

  return {
    version: 1 as const,
    projectId: input.projectId,
    kind: input.kind,
    fileName: input.file.name,
    fileSize: input.file.size,
    fileType: input.mimeType,
    lastModified: input.file.lastModified,
    uploadId: initData.uploadId,
    objectKey: initData.key,
    partSize: initData.partSize ?? defaultPartSize,
    uploadedParts: [],
    updatedAt: new Date().toISOString(),
  };
}

async function uploadMultipartPartWithRetry(input: {
  projectId: string;
  uploadId: string;
  objectKey: string;
  partNumber: number;
  chunk: Blob;
}) {
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt += 1;
    const timeout = createRequestTimeoutSignal(partUploadTimeoutMs);

    try {
      const response = await fetch(
        `/api/client-rooms/projects/${input.projectId}/assets/multipart?uploadId=${encodeURIComponent(input.uploadId)}&key=${encodeURIComponent(input.objectKey)}&partNumber=${input.partNumber}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/octet-stream",
          },
          body: input.chunk,
          signal: timeout.signal,
        },
      );
      const data = (await response.json()) as {
        error?: string;
        part?: UploadedPart;
      };

      if (!response.ok || !data.part) {
        throw new Error(data.error || `Failed to upload part ${input.partNumber}`);
      }

      timeout.clear();
      return data.part;
    } catch (error) {
      timeout.clear();

      if (attempt >= maxRetries) {
        throw error instanceof Error
          ? error
          : new Error(`Failed to upload part ${input.partNumber}`);
      }

      await wait(getRetryDelay(attempt));
    }
  }

  throw new Error(`Failed to upload part ${input.partNumber}`);
}

async function abortMultipartUpload(
  projectId: string,
  uploadId: string,
  objectKey: string,
) {
  try {
    await fetch(
      `/api/client-rooms/projects/${projectId}/assets/multipart?uploadId=${encodeURIComponent(uploadId)}&key=${encodeURIComponent(objectKey)}`,
      {
        method: "DELETE",
      },
    );
  } catch {
    // Best-effort cleanup only.
  }
}

function buildMultipartSessionKey(
  projectId: string,
  kind: ClientRoomAssetKind,
  file: File,
) {
  return `${multipartSessionPrefix}:${projectId}:${kind}:${file.name}:${file.size}:${file.lastModified}`;
}

function readMultipartUploadSession(
  sessionKey: string,
  input: {
    projectId: string;
    kind: ClientRoomAssetKind;
    file: File;
  },
): MultipartUploadSession | null {
  if (!canUseUploadSessionStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(sessionKey);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as Partial<MultipartUploadSession>;
    if (
      session.version !== 1 ||
      session.projectId !== input.projectId ||
      session.kind !== input.kind ||
      session.fileName !== input.file.name ||
      session.fileSize !== input.file.size ||
      session.lastModified !== input.file.lastModified ||
      typeof session.uploadId !== "string" ||
      typeof session.objectKey !== "string" ||
      typeof session.partSize !== "number"
    ) {
      window.localStorage.removeItem(sessionKey);
      return null;
    }

    return {
      version: 1,
      projectId: session.projectId,
      kind: session.kind,
      fileName: session.fileName,
      fileSize: session.fileSize,
      fileType: session.fileType || input.file.type || "application/octet-stream",
      lastModified: session.lastModified,
      uploadId: session.uploadId,
      objectKey: session.objectKey,
      partSize: session.partSize,
      uploadedParts: mergeUploadedParts(session.uploadedParts ?? []),
      updatedAt: typeof session.updatedAt === "string" ? session.updatedAt : new Date().toISOString(),
    };
  } catch {
    window.localStorage.removeItem(sessionKey);
    return null;
  }
}

function writeMultipartUploadSession(
  sessionKey: string,
  session: MultipartUploadSession,
) {
  if (!canUseUploadSessionStorage()) {
    return;
  }

  window.localStorage.setItem(sessionKey, JSON.stringify(session));
}

function clearMultipartUploadSession(sessionKey: string) {
  if (!canUseUploadSessionStorage()) {
    return;
  }

  window.localStorage.removeItem(sessionKey);
}

function canUseUploadSessionStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function mergeUploadedParts(parts: UploadedPart[]) {
  const uniqueParts = new Map<number, UploadedPart>();

  for (const part of parts) {
    if (!Number.isInteger(part.partNumber) || part.partNumber < 1 || !part.etag) {
      continue;
    }

    uniqueParts.set(part.partNumber, part);
  }

  return [...uniqueParts.values()].sort((left, right) => left.partNumber - right.partNumber);
}

function getUploadedBytes(
  fileSize: number,
  partSize: number,
  uploadedParts: UploadedPart[],
) {
  return uploadedParts.reduce(
    (total, part) => total + getChunkSize(fileSize, partSize, part.partNumber),
    0,
  );
}

function getChunkSize(fileSize: number, partSize: number, partNumber: number) {
  const start = (partNumber - 1) * partSize;
  const end = Math.min(start + partSize, fileSize);
  return Math.max(0, end - start);
}

function calculateUploadProgress(uploadedBytes: number, totalBytes: number) {
  if (totalBytes <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((uploadedBytes / totalBytes) * 100));
}

function isStaleMultipartUploadError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return staleUploadMarkers.some((marker) => message.includes(marker));
}

function getRetryDelay(attempt: number) {
  return Math.min(10_000, attempt * 1_500);
}

function createRequestTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort(new Error("Upload request timed out"));
  }, timeoutMs);

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeoutId),
  };
}

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}
