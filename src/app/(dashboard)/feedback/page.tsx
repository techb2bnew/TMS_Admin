import { Suspense } from "react";
import FeedbackView from "./FeedbackView";

export default function FeedbackPage() {
  return (
    <Suspense>
      <FeedbackView />
    </Suspense>
  );
}
