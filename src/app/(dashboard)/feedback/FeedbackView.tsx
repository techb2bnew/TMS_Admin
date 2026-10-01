"use client";

import { useEffect, useState, type FormEvent } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/useToast";
import { formatDate } from "@/lib/format";
import type { FeedbackItem } from "@/types";

const T = APP_TEXT.feedback;
const CATEGORIES: FeedbackItem["category"][] = ["bug", "feature_request", "other"];

type FeedbackRow = {
  id: string;
  created_by: string | null;
  message: string;
  category: FeedbackItem["category"];
  status: FeedbackItem["status"];
  created_at: string;
};

function toFeedback(row: FeedbackRow): FeedbackItem {
  return {
    id: row.id,
    createdBy: row.created_by,
    message: row.message,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
  };
}

function FeedbackView() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<FeedbackItem["category"]>("other");
  const [submitting, setSubmitting] = useState(false);
  const { message: toastMessage, showToast } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("feedback")
        .select("id, created_by, message, category, status, created_at")
        .order("created_at", { ascending: false });
      setItems((data ?? []).map(toFeedback));
    }
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("feedback")
      .insert({ created_by: authData.user?.id, message: message.trim(), category })
      .select("id, created_by, message, category, status, created_at")
      .single();

    setSubmitting(false);
    if (error || !data) {
      showToast(error?.message ?? "Could not send feedback");
      return;
    }

    setItems((prev) => [toFeedback(data), ...prev]);
    setMessage("");
    setCategory("other");
    showToast(T.submittedToast);
  }

  async function markResolved(item: FeedbackItem) {
    const supabase = createClient();
    const { error } = await supabase.from("feedback").update({ status: "resolved" }).eq("id", item.id);
    if (error) {
      showToast(error.message);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "resolved" } : i)));
  }

  return (
    <div>
      <PageHeader title={T.title} subtitle={T.subtitle} />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 mb-6 max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{T.categoryLabel}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackItem["category"])}
              className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {T.categories[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{T.messageLabel}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={T.messagePlaceholder}
              rows={4}
              className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="rounded-lg px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {T.submit}
          </button>
        </form>
      </div>

      <h2 className="text-sm font-semibold mb-3 opacity-70">{T.recentTitle}</h2>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium opacity-60">{T.categories[item.category]}</span>
                <span className="text-xs opacity-40">{formatDate(item.createdAt)}</span>
              </div>
              <p className="text-sm">{item.message}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  item.status === "open" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {T.statuses[item.status]}
              </span>
              {item.status === "open" && (
                <button
                  onClick={() => markResolved(item)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  {T.markResolved}
                </button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="px-5 py-10 text-center text-sm opacity-50">{T.emptyState}</div>}
      </div>

      <Toast message={toastMessage} />
    </div>
  );
}

export default FeedbackView;
