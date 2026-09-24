import Link from "next/link";
import { APP_TEXT } from "@/constants/text";

export default function PublicPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#eef2fb] via-[#e7edfa] to-[#dfe7f8] flex flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(37,99,235,0.08)_1px,transparent_0)] [background-size:28px_28px]" />
      <div className="absolute -top-40 -left-20 w-[36rem] h-[36rem] rounded-full bg-blue-300/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[34rem] h-[34rem] rounded-full bg-indigo-300/20 blur-3xl" />

      <div className="relative z-10 flex-1 flex justify-center px-6 py-14 sm:py-20">
        <div className="w-full max-w-2xl">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 mb-8 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
                <path d="M3 7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9H4a1 1 0 0 1-1-1V7Z" stroke="currentColor" />
                <path d="M14 10h4.4a1 1 0 0 1 .8.4l2 2.67a1 1 0 0 1 .2.6V15a1 1 0 0 1-1 1H14v-6Z" stroke="currentColor" />
                <circle cx="7.5" cy="17.5" r="1.6" stroke="currentColor" />
                <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" />
              </svg>
            </span>
            {APP_TEXT.app.name}
          </Link>

          <div className="relative rounded-2xl border border-white/60 bg-white/85 backdrop-blur-xl shadow-[0_20px_60px_rgba(37,99,235,0.15)] p-8 sm:p-10 overflow-hidden">
            <span className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#10182b] mb-2">{title}</h1>
            <p className="text-xs text-slate-400 mb-8">
              {APP_TEXT.legal.lastUpdated}: {APP_TEXT.legal.lastUpdatedDate}
            </p>
            {children}
          </div>

          <Link
            href="/login"
            className="mt-6 inline-block text-xs text-slate-500 hover:text-blue-600"
          >
            ← {APP_TEXT.legal.backToLogin}
          </Link>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between px-6 sm:px-12 lg:px-20 py-5 text-xs text-slate-400 border-t border-slate-300/40">
        <span>{APP_TEXT.app.tagline}</span>
        <span>© 2026 {APP_TEXT.app.name}</span>
      </div>
    </div>
  );
}
