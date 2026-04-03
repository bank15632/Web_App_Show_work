import type { Metadata } from "next";
import nextDynamic from "next/dynamic";

import { ErrorBoundary } from "@/components/ui/error-boundary";

const TodoListView = nextDynamic(
  () => import("@/components/portal/todo-list-view").then((mod) => mod.TodoListView),
  { loading: () => <PageSkeleton /> },
);

export const metadata: Metadata = {
  title: "Kanban Board — BNJ Studio",
  description:
    "Project execution board for processed tasks, review queues, and weekly reports.",
};

export const dynamic = "force-dynamic";

export default function TodosPage() {
  return (
    <ErrorBoundary>
      <TodoListView />
    </ErrorBoundary>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-5 lg:px-10">
        <div className="h-8 w-40 rounded-lg skeleton-shimmer" />
      </div>
      <div className="space-y-6 px-6 py-10 lg:px-10">
        <div className="h-40 rounded-[2rem] skeleton-shimmer" />
        <div className="h-64 rounded-[2rem] skeleton-shimmer" />
      </div>
    </div>
  );
}
