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

const defaultPartSize = 10 * 1024 * 1024;
const maxRetries = 3;

export async function uploadClientRoomAssetMultipart({
  projectId,
  kind,
  file,
  onProgress,
}: MultipartUploadOptions) {
  if (file.size === 0) {
    throw new Error("File is empty");
  }

  onProgress?.(0);

  const initResponse = await fetch(`/api/client-rooms/projects/${projectId}/assets/multipart`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      kind,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
    }),
  });
  const initData = (await initResponse.json()) as {
    error?: string;
  } & Partial<MultipartInitResponse>;

  if (
    !initResponse.ok ||
    !initData.uploadId ||
    !initData.key
  ) {
    throw new Error(initData.error || "Failed to start multipart upload");
  }

  const uploadId = initData.uploadId;
  const objectKey = initData.key;
  const partSize = initData.partSize ?? defaultPartSize;
  const uploadedParts: UploadedPart[] = [];
  let isCompleted = false;

  try {
    let uploadedBytes = 0;
    const partCount = Math.ceil(file.size / partSize);

    for (let index = 0; index < partCount; index += 1) {
      const start = index * partSize;
      const end = Math.min(start + partSize, file.size);
      const chunk = file.slice(start, end);
      const partNumber = index + 1;

      const part = await uploadMultipartPartWithRetry({
        projectId,
        uploadId,
        objectKey,
        partNumber,
        chunk,
      });

      uploadedParts.push(part);
      uploadedBytes += end - start;
      onProgress?.(Math.min(100, Math.round((uploadedBytes / file.size) * 100)));
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
          mimeType: file.type || "application/octet-stream",
          key: objectKey,
          uploadId,
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

    isCompleted = true;
    onProgress?.(100);
    return completeData.url;
  } catch (error) {
    if (!isCompleted) {
      await abortMultipartUpload(projectId, uploadId, objectKey);
    }
    throw error;
  }
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

    try {
      const response = await fetch(
        `/api/client-rooms/projects/${input.projectId}/assets/multipart?uploadId=${encodeURIComponent(input.uploadId)}&key=${encodeURIComponent(input.objectKey)}&partNumber=${input.partNumber}`,
        {
          method: "PUT",
          headers: {
            "content-type": "application/octet-stream",
          },
          body: input.chunk,
        },
      );
      const data = (await response.json()) as {
        error?: string;
        part?: UploadedPart;
      };

      if (!response.ok || !data.part) {
        throw new Error(data.error || `Failed to upload part ${input.partNumber}`);
      }

      return data.part;
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error instanceof Error
          ? error
          : new Error(`Failed to upload part ${input.partNumber}`);
      }
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
