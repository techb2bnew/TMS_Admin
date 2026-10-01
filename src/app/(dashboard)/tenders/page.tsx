import { Suspense } from "react";
import TendersView from "./TendersView";

export default function TendersPage() {
  return (
    <Suspense>
      <TendersView />
    </Suspense>
  );
}
