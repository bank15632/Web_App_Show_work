type RevisionLikeDocument = {
  id: string;
  version: string;
  latest?: boolean;
};

export function getRevisionLabelForDocument<T extends RevisionLikeDocument>(
  documents: T[],
  document: T,
  index?: number,
) {
  const match = document.version.match(/(\d+)/);

  if (match) {
    return `Revise ${match[1].padStart(2, "0")}`;
  }

  const safeIndex =
    typeof index === "number"
      ? index
      : documents.findIndex((item) => item.id === document.id);
  const fallbackNumber = String(documents.length - safeIndex).padStart(2, "0");

  return `Revise ${fallbackNumber}`;
}

export function getRevisionOptions<T extends RevisionLikeDocument>(documents: T[]) {
  const seenLabels = new Set<string>();

  return documents.flatMap((document) => {
    const label = getRevisionLabelForDocument(documents, document);
    if (seenLabels.has(label)) {
      return [];
    }

    seenLabels.add(label);
    return [label];
  });
}

export function getDefaultRevisionLabel<T extends RevisionLikeDocument>(documents: T[]) {
  const latestDocument = documents.find((document) => document.latest);

  if (latestDocument) {
    return getRevisionLabelForDocument(documents, latestDocument);
  }

  return getRevisionOptions(documents)[0] ?? "";
}

export function filterDocumentsByRevision<T extends RevisionLikeDocument>(
  documents: T[],
  allDocuments: T[],
  revisionLabel: string,
) {
  if (!revisionLabel) {
    return documents;
  }

  return documents.filter(
    (document) => getRevisionLabelForDocument(allDocuments, document) === revisionLabel,
  );
}

export function getNextRevisionLabel<T extends RevisionLikeDocument>(documents: T[]) {
  const maxRevisionNumber = documents.reduce((currentMax, document) => {
    const match = document.version.match(/(\d+)/);
    const revisionNumber = match ? Number.parseInt(match[1] ?? "", 10) : 0;
    return Number.isNaN(revisionNumber)
      ? currentMax
      : Math.max(currentMax, revisionNumber);
  }, 0);

  return `Revise ${String(maxRevisionNumber + 1).padStart(2, "0")}`;
}

export function getRevisionSummaries<T extends RevisionLikeDocument>(documents: T[]) {
  const latestLabel = getDefaultRevisionLabel(documents);

  return getRevisionOptions(documents).map((label, index) => ({
    index,
    label,
    count: filterDocumentsByRevision(documents, documents, label).length,
    isLatest: label === latestLabel,
  }));
}

export function setLatestRevision<T extends RevisionLikeDocument>(
  documents: T[],
  revisionLabel: string,
) {
  return documents.map((document) => ({
    ...document,
    latest: getRevisionLabelForDocument(documents, document) === revisionLabel,
  }));
}

export function moveRevisionGroup<T extends RevisionLikeDocument>(
  documents: T[],
  revisionLabel: string,
  direction: -1 | 1,
) {
  const revisionLabels = getRevisionOptions(documents);
  const currentIndex = revisionLabels.indexOf(revisionLabel);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= revisionLabels.length) {
    return documents;
  }

  const reorderedLabels = [...revisionLabels];
  const [movedLabel] = reorderedLabels.splice(currentIndex, 1);

  if (!movedLabel) {
    return documents;
  }

  reorderedLabels.splice(nextIndex, 0, movedLabel);

  return reorderedLabels.flatMap((label) =>
    filterDocumentsByRevision(documents, documents, label),
  );
}
