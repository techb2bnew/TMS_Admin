import type { Metadata } from "next";
import PublicPageLayout from "@/components/PublicPageLayout";
import { APP_TEXT } from "@/constants/text";

export const metadata: Metadata = {
  title: `${APP_TEXT.deleteAccount.title} — ${APP_TEXT.app.name}`,
};

export default function DeleteAccountPage() {
  const T = APP_TEXT.deleteAccount;
  return (
    <PublicPageLayout title={T.title}>
      <p className="text-sm text-slate-600 mb-6">{T.intro}</p>
      <div className="space-y-6">
        {T.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-sm font-semibold text-[#10182b] mb-1.5">{section.heading}</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 leading-relaxed">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        <p className="text-sm text-slate-600">
          {T.contactPrefix}{" "}
          <a href={`mailto:${APP_TEXT.support.emailValue}`} className="font-semibold text-blue-600 hover:text-blue-700">
            {APP_TEXT.support.emailValue}
          </a>
          .
        </p>
      </div>
    </PublicPageLayout>
  );
}
