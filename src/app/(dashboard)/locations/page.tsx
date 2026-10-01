import { Suspense } from "react";
import LocationsView from "./LocationsView";

export default function LocationsPage() {
  return (
    <Suspense>
      <LocationsView />
    </Suspense>
  );
}
