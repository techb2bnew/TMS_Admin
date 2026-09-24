import type { Invoice, Settlement } from "@/types";

// Mutating this exported array (not reassigning it) lets a newly created
// invoice show up on the Billing page too within the same client session —
// both pages read the same module-level array. Once this app is wired to
// Supabase, this becomes a real insert into the `invoices` table instead.
export function addMockInvoice(invoice: Invoice) {
  mockInvoices.unshift(invoice);
}

export const mockInvoices: Invoice[] = [
  {
    id: "INV-2041",
    load_id: "LD-1041",
    customer_name: "Om Sai Logistics",
    amount: 9800,
    status: "paid",
    created_at: "2026-09-19T15:00:00Z",
  },
  {
    id: "INV-2040",
    load_id: "LD-1040",
    customer_name: "Kanha Agro Foods",
    amount: 7200,
    status: "paid",
    created_at: "2026-09-19T09:00:00Z",
  },
  {
    id: "INV-2039",
    load_id: "LD-1039",
    customer_name: "Sharma Textiles",
    amount: 11400,
    status: "unpaid",
    created_at: "2026-09-21T07:00:00Z",
  },
  {
    id: "INV-2035",
    load_id: "LD-1035",
    customer_name: "Om Sai Logistics",
    amount: 6700,
    status: "unpaid",
    created_at: "2026-09-18T12:30:00Z",
  },
  {
    id: "INV-2028",
    load_id: "LD-1028",
    customer_name: "Bansal Traders",
    amount: 18200,
    status: "paid",
    created_at: "2026-09-14T10:00:00Z",
  },
  {
    id: "INV-2021",
    load_id: "LD-1021",
    customer_name: "Neelkanth Pharma",
    amount: 13800,
    status: "paid",
    created_at: "2026-09-10T11:00:00Z",
  },
];

export const mockSettlements: Settlement[] = [
  {
    id: "ST-501",
    load_id: "LD-1041",
    driver_name: "Suresh Patil",
    amount: 2200,
    status: "paid",
    created_at: "2026-09-19T16:00:00Z",
  },
  {
    id: "ST-500",
    load_id: "LD-1040",
    driver_name: "Rakesh Yadav",
    amount: 1600,
    status: "paid",
    created_at: "2026-09-19T10:00:00Z",
  },
  {
    id: "ST-499",
    load_id: "LD-1037",
    driver_name: "Gagan Deep",
    amount: 3100,
    status: "unpaid",
    created_at: "2026-09-20T18:30:00Z",
  },
  {
    id: "ST-498",
    load_id: "LD-1028",
    driver_name: "Gagan Deep",
    amount: 4300,
    status: "unpaid",
    created_at: "2026-09-14T11:00:00Z",
  },
];
