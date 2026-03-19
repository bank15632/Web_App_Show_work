"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import type { TrackerReviewItemRecord } from "@/lib/tracker/types";

function parseReviewProposal(reviewItem: TrackerReviewItemRecord) {
  try {
    return JSON.parse(reviewItem.proposalJson) as {
      action?: string;
      entity?: Record<string, unknown>;
    };
  } catch {
    return {
      action: reviewItem.action,
      entity: {},
    };
  }
}

export function ReviewQueue({
  items,
  onApprove,
  onReject,
}: {
  items: TrackerReviewItemRecord[];
  onApprove: (reviewItemId: string) => Promise<void>;
  onReject: (reviewItemId: string, reason: string) => Promise<void>;
}) {
  const pending = items.filter((item) => item.status === "pending");

  return (
    <section className="space-y-4">
      <div>
        <p className="caption-editorial text-[0.7rem]">Review Queue</p>
        <h3 className="mt-1 font-display text-3xl font-medium tracking-tight">
          Pending AI proposals
        </h3>
      </div>
      <div className="space-y-3">
        {pending.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-background px-5 py-10 text-center text-muted-foreground">
            No pending proposals.
          </div>
        ) : null}
        {pending.map((item) => (
          <ReviewItemCard
            key={item.id}
            item={item}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </div>
    </section>
  );
}

function ReviewItemCard({
  item,
  onApprove,
  onReject,
}: {
  item: TrackerReviewItemRecord;
  onApprove: (reviewItemId: string) => Promise<void>;
  onReject: (reviewItemId: string, reason: string) => Promise<void>;
}) {
  const proposal = parseReviewProposal(item);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  async function handleApprove() {
    setWorking(true);
    try {
      await onApprove(item.id);
    } finally {
      setWorking(false);
    }
  }

  async function handleReject() {
    setWorking(true);
    try {
      await onReject(item.id, reason || "Rejected during review");
    } finally {
      setWorking(false);
    }
  }

  return (
    <article className="rounded-[1.5rem] border border-border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="caption-editorial text-[0.68rem]">{proposal.action || item.action}</p>
          <h4 className="mt-1 text-base font-medium">{proposal.entity?.title as string ?? "AI proposal"}</h4>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {item.reasoningSummary}
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {(item.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-[1.25rem] bg-secondary px-4 py-3 text-xs leading-6 text-muted-foreground whitespace-pre-wrap">
        {JSON.stringify(proposal.entity, null, 2)}
      </pre>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Optional rejection reason"
          className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-foreground"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={working}
            onClick={() => {
              void handleApprove();
            }}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
          >
            <Check className="size-4" />
            Approve
          </button>
          <button
            type="button"
            disabled={working}
            onClick={() => {
              void handleReject();
            }}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-60"
          >
            <X className="size-4" />
            Reject
          </button>
        </div>
      </div>
    </article>
  );
}
