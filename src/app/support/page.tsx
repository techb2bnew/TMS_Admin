import type { Metadata } from "next";
import PublicPageLayout from "@/components/PublicPageLayout";
import { APP_TEXT } from "@/constants/text";

export const metadata: Metadata = {
  title: `${APP_TEXT.support.title} — ${APP_TEXT.app.name}`,
};

const ROWS = [
  { label: APP_TEXT.support.phoneLabel, value: APP_TEXT.support.phoneValue, href: `tel:${APP_TEXT.support.phoneValue.replace(/\s/g, "")}` },
  { label: APP_TEXT.support.emailLabel, value: APP_TEXT.support.emailValue, href: `mailto:${APP_TEXT.support.emailValue}` },
  { label: APP_TEXT.support.hoursLabel, value: APP_TEXT.support.hoursValue, href: undefined },
];

export default function SupportPage() {
  return (
    <PublicPageLayout title={APP_TEXT.support.title}>
      <p className="text-sm text-slate-600 mb-8">{APP_TEXT.support.subtitle}</p>
      <div className="divide-y divide-slate-200/70 rounded-xl border border-slate-200/70 overflow-hidden">
        {ROWS.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3.5 bg-white/60">
            <span className="text-sm font-medium text-slate-500">{row.label}</span>
            {row.href ? (
              <a href={row.href} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                {row.value}
              </a>
            ) : (
              <span className="text-sm font-semibold text-[#10182b]">{row.value}</span>
            )}
          </div>
        ))}
      </div>
    </PublicPageLayout>
  );
}
