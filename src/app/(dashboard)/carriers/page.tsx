import { Suspense } from "react";
import CarriersView from "./CarriersView";

export default function CarriersPage() {
  return (
    <Suspense>
      <CarriersView />
    </Suspense>
  );
}
