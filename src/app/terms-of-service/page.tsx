import type { Metadata } from "next";
import PublicPageLayout from "@/components/PublicPageLayout";
import { APP_TEXT } from "@/constants/text";

export const metadata: Metadata = {
  title: `${APP_TEXT.termsOfService.title} — ${APP_TEXT.app.name}`,
};

export default function TermsOfServicePage() {
  return (
    <PublicPageLayout title={APP_TEXT.termsOfService.title}>
      <div className="space-y-6">
        {APP_TEXT.termsOfService.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-sm font-semibold text-[#10182b] mb-1.5">{section.heading}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </PublicPageLayout>
  );
}
