"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { APP_TEXT } from "@/constants/text";
import { AUTH_COOKIE_NAME, STATIC_ADMIN_CREDENTIALS } from "@/constants/auth";
import { isValidEmail } from "@/lib/validation";

const T = APP_TEXT.login;

const STATS = [
  { label: "Live Tracking", hint: "Updated every 30s" },
  { label: "Dispatch", hint: "One-click assign" },
  { label: "Billing", hint: "Auto invoiced" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = T.errors.emailRequired;
    } else if (!isValidEmail(email)) {
      errors.email = T.errors.emailInvalid;
    }

    if (!password) {
      errors.password = T.errors.passwordRequired;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!validate()) return;

    setIsSubmitting(true);

    // Static credential check — intentional, admin login stays hardcoded
    // even once the rest of the app connects to Supabase.
    await new Promise((resolve) => setTimeout(resolve, 400));

    const isValid =
      email.trim().toLowerCase() === STATIC_ADMIN_CREDENTIALS.email &&
      password === STATIC_ADMIN_CREDENTIALS.password;

    if (!isValid) {
      setFormError(T.errors.invalidCredentials);
      setIsSubmitting(false);
      return;
    }

    document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=${60 * 60 * 8}`;
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#eef2fb] via-[#e7edfa] to-[#dfe7f8] flex flex-col">
      {/* Full-screen animated network background */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g stroke="#2563eb" strokeOpacity="0.12" strokeWidth="1">
          <path d="M-50 680 L 420 520 L 780 640 L 1180 420 L 1700 560" />
          <path d="M-50 180 L 340 260 L 620 120 L 980 240 L 1350 90 L 1700 220" strokeDasharray="4 8" />
          <path d="M180 -40 L 340 260 L 250 620 L 420 940" />
          <path d="M980 240 L 1180 420 L 1080 760 L 1300 940" strokeDasharray="4 8" />
          <path d="M620 120 L 780 640" />
          <path d="M1350 90 L 1300 940" strokeDasharray="4 8" />
        </g>
        <g fill="#2563eb" fillOpacity="0.25">
          <circle cx="420" cy="520" r="3.5" />
          <circle cx="780" cy="640" r="3.5" />
          <circle cx="340" cy="260" r="3.5" />
          <circle cx="620" cy="120" r="3.5" />
          <circle cx="980" cy="240" r="3.5" />
          <circle cx="1350" cy="90" r="3.5" />
          <circle cx="1180" cy="420" r="3.5" />
          <circle cx="250" cy="620" r="3.5" />
          <circle cx="1080" cy="760" r="3.5" />
        </g>
        {/* Glowing pulse nodes */}
        {[
          { cx: 340, cy: 260 },
          { cx: 980, cy: 240 },
          { cx: 780, cy: 640 },
          { cx: 1180, cy: 420 },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.cx} ${p.cy})`}>
            <circle r="16" fill="#2563eb" fillOpacity="0.18" className="animate-pulse-ring" />
            <circle r="4" fill="#2563eb" fillOpacity="0.5" />
          </g>
        ))}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(37,99,235,0.08)_1px,transparent_0)] [background-size:28px_28px]" />
      <div className="absolute -top-40 -left-20 w-[36rem] h-[36rem] rounded-full bg-blue-300/20 blur-3xl animate-mesh" />
      <div
        className="absolute bottom-0 right-0 w-[34rem] h-[34rem] rounded-full bg-indigo-300/20 blur-3xl animate-mesh"
        style={{ animationDelay: "4s" }}
      />

      {/* Content — two even 50/50 halves, each centered within itself */}
      <div className="relative z-10 flex-1 grid lg:grid-cols-2">
        {/* Left half */}
        <div className="flex items-center justify-center px-6 sm:px-12 lg:px-16 py-16">
        <div className="max-w-lg animate-fade-in-up">
          <div className="flex items-center gap-2 mb-6">
            <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.7">
                <path d="M3 7a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9H4a1 1 0 0 1-1-1V7Z" stroke="currentColor" />
                <path d="M14 10h4.4a1 1 0 0 1 .8.4l2 2.67a1 1 0 0 1 .2.6V15a1 1 0 0 1-1 1H14v-6Z" stroke="currentColor" />
                <circle cx="7.5" cy="17.5" r="1.6" stroke="currentColor" />
                <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-[#10182b]">{APP_TEXT.app.name}</span>
          </div>

          <div className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">
            Fleet Operations
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold text-[#10182b] leading-tight mb-4">
            {T.brandHeadline}
          </h1>
          <p className="text-slate-500 text-base mb-10 max-w-md">{T.brandSubtext}</p>

          <div className="flex items-center gap-6 sm:gap-10 flex-wrap">
            {STATS.map((stat, i) => (
              <div key={stat.label} className={i > 0 ? "pl-6 sm:pl-10 border-l border-slate-300/70" : ""}>
                <div className="text-sm font-semibold text-[#10182b]">{stat.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.hint}</div>
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* Right half — card */}
        <div className="flex items-center justify-center px-6 sm:px-12 lg:px-16 py-16">
        <div className="w-full max-w-sm animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="relative rounded-2xl border border-white/60 bg-white/85 backdrop-blur-xl shadow-[0_20px_60px_rgba(37,99,235,0.15)] p-8 overflow-hidden">
            <span className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500" />
            <h2 className="text-2xl font-semibold mb-1 text-[#10182b]">{T.formTitle}</h2>
            <p className="text-sm text-slate-500 mb-8">{T.formSubtitle}</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[#10182b]">
                  {T.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={T.emailPlaceholder}
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white/70 text-[#10182b] placeholder:text-slate-400 outline-none transition-colors focus:ring-2 focus:ring-blue-500/30 ${
                    fieldErrors.email ? "border-red-500" : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[#10182b]">
                  {T.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={T.passwordPlaceholder}
                    aria-invalid={Boolean(fieldErrors.password)}
                    className={`w-full rounded-lg border px-3.5 py-2.5 pr-16 text-sm bg-white/70 text-[#10182b] placeholder:text-slate-400 outline-none transition-colors focus:ring-2 focus:ring-blue-500/30 ${
                      fieldErrors.password ? "border-red-500" : "border-slate-200 focus:border-blue-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-[#10182b]"
                  >
                    {showPassword ? T.hidePassword : T.showPassword}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 transition-all shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_10px_28px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {isSubmitting ? T.submitLoading : T.submit}
              </button>
            </form>
          </div>

          <p className="mt-5 text-xs text-center text-slate-500">{T.footerNote}</p>
        </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-12 lg:px-20 py-5 text-xs text-slate-400 border-t border-slate-300/40">
        <span>{APP_TEXT.app.tagline}</span>
        <span>© 2026 {APP_TEXT.app.name}</span>
      </div>
    </div>
  );
}
