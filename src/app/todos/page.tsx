import type { Metadata } from "next";

import { TodoListView } from "@/components/portal/todo-list-view";

export const metadata: Metadata = {
  title: "Kanban Board — BNJ Studio",
  description:
    "Project execution board for processed tasks, review queues, and weekly reports.",
};

export const dynamic = "force-dynamic";

export default function TodosPage() {
  return <TodoListView />;
}
