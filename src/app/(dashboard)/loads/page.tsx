import { Suspense } from "react";
import LoadsView from "./LoadsView";

export default function LoadsPage() {
  return (
    <Suspense>
      <LoadsView />
    </Suspense>
  );
}
