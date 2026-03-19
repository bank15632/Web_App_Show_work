import type { Metadata } from "next";

import { TodoListView } from "@/components/portal/todo-list-view";

export const metadata: Metadata = {
  title: "AI Project Tracker — BNJ Studio",
};

export const dynamic = "force-dynamic";

export default function TodosPage() {
  return <TodoListView />;
}
