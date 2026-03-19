import type { Metadata } from "next";

import { TodoListView } from "@/components/portal/todo-list-view";

export const metadata: Metadata = {
  title: "Todo List — BNJ Studio",
};

export default function TodosPage() {
  return <TodoListView />;
}
