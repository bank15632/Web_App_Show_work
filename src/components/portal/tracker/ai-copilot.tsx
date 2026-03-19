"use client";

import { useState } from "react";
import { Bot, MessageSquareText, Sparkles, Upload } from "lucide-react";

import type { TrackerProjectDetail, TrackerQueryResult } from "@/lib/tracker/types";

export function AICopilot({
  project,
  onAsk,
  onGenerateWeekly,
  onOpenIntake,
}: {
  project: TrackerProjectDetail;
  onAsk: (question: string) => Promise<TrackerQueryResult>;
  onGenerateWeekly: () => Promise<void>;
  onOpenIntake: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<TrackerQueryResult | null>(null);
  const [working, setWorking] = useState(false);

  async function submit(questionText: string) {
    if (!questionText.trim()) return;
    setWorking(true);
    try {
      const nextResult = await onAsk(questionText.trim());
      setResult(nextResult);
      setQuestion("");
    } finally {
      setWorking(false);
    }
  }

  return (
    <aside className="flex h-full min-w-[330px] max-w-[360px] flex-col border-l border-border bg-[linear-gradient(180deg,#fff_0%,#fafafa_100%)]">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-foreground text-background">
            <Bot className="size-5" />
          </span>
          <div>
            <p className="caption-editorial text-[0.68rem]">AI Copilot</p>
            <h3 className="font-display text-2xl font-medium tracking-tight">
              {project.code}
            </h3>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Review-gated assistance for meeting notes, site issues, revision logs, and quick natural-language search.
        </p>
      </div>

      <div className="space-y-3 border-b border-border px-5 py-5">
        <button
          type="button"
          onClick={onOpenIntake}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:border-foreground"
        >
          <Upload className="size-4" />
          Open intake tools
        </button>
        <button
          type="button"
          onClick={() => {
            void onGenerateWeekly();
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <Sparkles className="size-4" />
          Queue weekly report
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="rounded-[1.5rem] border border-border bg-background p-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-4" />
            <span className="text-sm font-medium">Ask the tracker</span>
          </div>
          <div className="mt-3 space-y-3">
            <button
              type="button"
              onClick={() => {
                void submit("What is overdue on this project?");
              }}
              className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              What is overdue?
            </button>
            <button
              type="button"
              onClick={() => {
                void submit("What is blocked because of contractor or consultant?");
              }}
              className="ml-2 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              What is blocked?
            </button>
          </div>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about RFIs, blocked work, overdue tasks, or revision impact..."
            rows={5}
            className="mt-4 w-full rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition-colors focus:border-foreground"
          />
          <button
            type="button"
            disabled={working}
            onClick={() => {
              void submit(question);
            }}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
          >
            {working ? "Thinking..." : "Ask"}
          </button>
          {result ? (
            <div className="mt-4 rounded-[1.25rem] bg-secondary px-4 py-4">
              <p className="text-sm leading-7 text-foreground">{result.answer}</p>
              {result.snippets.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {result.snippets.map((snippet) => (
                    <p key={snippet} className="text-xs leading-6 text-muted-foreground">
                      {snippet}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
