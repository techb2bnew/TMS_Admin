import { Suspense } from "react";
import ExpensesView from "./ExpensesView";

export default function ExpensesPage() {
  return (
    <Suspense>
      <ExpensesView />
    </Suspense>
  );
}
