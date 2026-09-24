import { Suspense } from "react";
import CustomersView from "./CustomersView";

export default function CustomersPage() {
  return (
    <Suspense>
      <CustomersView />
    </Suspense>
  );
}
