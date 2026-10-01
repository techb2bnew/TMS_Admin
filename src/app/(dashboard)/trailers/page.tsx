import { Suspense } from "react";
import TrailersView from "./TrailersView";

export default function TrailersPage() {
  return (
    <Suspense>
      <TrailersView />
    </Suspense>
  );
}
