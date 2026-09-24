"use client";

import Modal from "@/components/ui/Modal";
import { APP_TEXT } from "@/constants/text";
import { formatRelativeTime } from "@/lib/format";
import type { CheckCall, Load } from "@/types";

const T = APP_TEXT.loads.loadActions;

type LoadLogModalProps = {
  open: boolean;
  load: Load | null;
  checkCalls: CheckCall[];
  onClose: () => void;
};

export default function LoadLogModal({ open, load, checkCalls, onClose }: LoadLogModalProps) {
  if (!load) return null;

  const entries = [
    ...checkCalls
      .filter((c) => c.loadId === load.id)
      .map((c) => ({ id: c.id, note: c.note, createdAt: c.createdAt, createdBy: c.createdBy })),
    {
      id: "status",
      note: `${T.loadLogStatusPrefix} ${load.status}`,
      createdAt: load.created_at,
      createdBy: "System",
    },
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={T.loadLogTitle}
      subtitle={`${T.loadLogSubtitlePrefix} ${load.id}`}
    >
      {entries.length === 0 ? (
        <p className="text-sm opacity-50 text-center py-6">{T.loadLogEmpty}</p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-3">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm">{entry.note}</p>
                <p className="text-xs opacity-50 mt-0.5">
                  {entry.createdBy} · {formatRelativeTime(entry.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
