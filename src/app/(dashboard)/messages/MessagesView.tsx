"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { ChatMessage } from "@/types";

const T = APP_TEXT.messages;

type DriverOption = { id: string; fullName: string };

function toMessage(row: {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function MessagesView() {
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [adminId, setAdminId] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDrivers() {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      setAdminId(authData.user?.id ?? "");

      const { data } = await supabase.from("drivers").select("id, profiles(full_name)");
      setDrivers(
        (data ?? []).map((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return { id: row.id, fullName: profile?.full_name ?? "Driver" };
        })
      );
    }
    loadDrivers();
  }, []);

  useEffect(() => {
    if (!selectedDriverId || !adminId) return;

    const supabase = createClient();
    let mounted = true;

    async function loadThread() {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, recipient_id, body, read_at, created_at")
        .or(
          `and(sender_id.eq.${adminId},recipient_id.eq.${selectedDriverId}),and(sender_id.eq.${selectedDriverId},recipient_id.eq.${adminId})`
        )
        .order("created_at", { ascending: true });
      if (mounted) setMessages((data ?? []).map(toMessage));
    }
    loadThread();

    const channel = supabase
      .channel(`messages-${adminId}-${selectedDriverId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as Parameters<typeof toMessage>[0];
          const involvesThisThread =
            (row.sender_id === adminId && row.recipient_id === selectedDriverId) ||
            (row.sender_id === selectedDriverId && row.recipient_id === adminId);
          if (involvesThisThread) setMessages((prev) => [...prev, toMessage(row)]);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [selectedDriverId, adminId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !selectedDriverId || !adminId) return;

    setSending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("messages")
      .insert({ sender_id: adminId, recipient_id: selectedDriverId, body: draft.trim() });
    setSending(false);

    if (!error) setDraft("");
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <PageHeader title={T.title} subtitle={T.subtitle} />

      <div className="mb-4 max-w-xs">
        <select
          value={selectedDriverId}
          onChange={(e) => {
            setMessages([]);
            setSelectedDriverId(e.target.value);
          }}
          className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
        >
          <option value="">{T.selectDriverPlaceholder}</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {!selectedDriverId && (
            <div className="h-full flex items-center justify-center text-sm opacity-50">{T.noDriverSelected}</div>
          )}
          {selectedDriverId && messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-sm opacity-50">{T.noMessages}</div>
          )}
          {messages.map((m) => {
            const fromAdmin = m.senderId === adminId;
            return (
              <div key={m.id} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs rounded-2xl px-3.5 py-2 text-sm ${
                    fromAdmin ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p>{m.body}</p>
                  <p className={`text-[10px] mt-1 ${fromAdmin ? "text-white/70" : "opacity-50"}`}>
                    {formatDate(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={T.typePlaceholder}
            disabled={!selectedDriverId}
            className="flex-1 rounded-lg border border-blue-600/10 dark:border-blue-400/10 px-3.5 py-2.5 text-sm bg-transparent outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || !selectedDriverId || sending}
            className="rounded-lg px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 text-white transition-all shadow-md shadow-blue-600/20"
          >
            {T.send}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MessagesView;
