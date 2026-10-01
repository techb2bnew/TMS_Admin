"use client";

import { useEffect, useMemo, useState } from "react";
import { APP_TEXT } from "@/constants/text";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { SearchIcon, DocumentsIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";

const T = APP_TEXT.documents;

type DocRow = {
  id: string;
  loadNumber: string;
  customerName: string;
  type: keyof typeof T.types;
  fileUrl: string;
  uploadedAt: string;
};

function DocumentsView() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const [{ data: loadDocs }, { data: podDocs }] = await Promise.all([
        supabase
          .from("load_documents")
          .select("id, type, file_url, uploaded_at, loads(load_number, customer_name)")
          .order("uploaded_at", { ascending: false }),
        supabase
          .from("pod_documents")
          .select("id, file_url, uploaded_at, loads(load_number, customer_name)")
          .order("uploaded_at", { ascending: false }),
      ]);

      const fromLoadDocs: DocRow[] = (loadDocs ?? []).map((row) => {
        const load = Array.isArray(row.loads) ? row.loads[0] : row.loads;
        return {
          id: row.id,
          loadNumber: load?.load_number ?? "—",
          customerName: load?.customer_name ?? "—",
          type: row.type as DocRow["type"],
          fileUrl: row.file_url,
          uploadedAt: row.uploaded_at,
        };
      });

      const fromPodDocs: DocRow[] = (podDocs ?? []).map((row) => {
        const load = Array.isArray(row.loads) ? row.loads[0] : row.loads;
        return {
          id: row.id,
          loadNumber: load?.load_number ?? "—",
          customerName: load?.customer_name ?? "—",
          type: "pod",
          fileUrl: row.file_url,
          uploadedAt: row.uploaded_at,
        };
      });

      setDocs(
        [...fromLoadDocs, ...fromPodDocs].sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )
      );
    }
    load();
  }, []);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) => d.loadNumber.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q)
    );
  }, [docs, query]);

  return (
    <div>
      <PageHeader title={T.title} subtitle={T.subtitle} />

      <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
        <StatCard label={T.statTotal} value={docs.length} Icon={DocumentsIcon} accent="blue" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={T.searchPlaceholder}
            className="w-full rounded-lg border border-blue-600/10 dark:border-blue-400/10 bg-transparent pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-colors"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs opacity-50 text-left bg-slate-50">
                <th className="font-medium px-5 py-3">{T.table.load}</th>
                <th className="font-medium px-5 py-3">{T.table.customer}</th>
                <th className="font-medium px-5 py-3">{T.table.type}</th>
                <th className="font-medium px-5 py-3">{T.table.uploaded}</th>
                <th className="font-medium px-5 py-3 text-right">{T.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-t border-blue-600/5 dark:border-blue-400/5 hover:bg-blue-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium">{doc.loadNumber}</td>
                  <td className="px-5 py-3.5 opacity-80">{doc.customerName}</td>
                  <td className="px-5 py-3.5 opacity-70">{T.types[doc.type]}</td>
                  <td className="px-5 py-3.5 opacity-60 whitespace-nowrap">{formatDate(doc.uploadedAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      {T.view}
                    </a>
                  </td>
                </tr>
              ))}

              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm opacity-50">
                    {T.emptyState}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DocumentsView;
