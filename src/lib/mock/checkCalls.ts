import type { CheckCall } from "@/types";

export const mockCheckCalls: CheckCall[] = [
  {
    id: "cc1",
    loadId: "LD-1042",
    note: "Driver crossed Gurugram toll, on schedule",
    createdAt: "2026-09-20T10:30:00Z",
    createdBy: "Neha Kapoor",
  },
  {
    id: "cc2",
    loadId: "LD-1042",
    note: "Stopped for fuel near Behror, resuming shortly",
    createdAt: "2026-09-20T13:45:00Z",
    createdBy: "Neha Kapoor",
  },
  {
    id: "cc3",
    loadId: "LD-1041",
    note: "Reached Pune warehouse, unloading in progress",
    createdAt: "2026-09-19T15:20:00Z",
    createdBy: "Arjun Mehta",
  },
  {
    id: "cc4",
    loadId: "LD-1040",
    note: "Delivered on time, POD collected",
    createdAt: "2026-09-19T09:30:00Z",
    createdBy: "Neha Kapoor",
  },
  {
    id: "cc5",
    loadId: "LD-1039",
    note: "Driver assigned, awaiting pickup confirmation",
    createdAt: "2026-09-21T07:10:00Z",
    createdBy: "Neha Kapoor",
  },
  {
    id: "cc6",
    loadId: "LD-1037",
    note: "Picked up from Jaipur, en route to Ahmedabad",
    createdAt: "2026-09-20T19:00:00Z",
    createdBy: "Arjun Mehta",
  },
  {
    id: "cc7",
    loadId: "LD-1037",
    note: "Minor traffic delay near Udaipur, revised ETA shared",
    createdAt: "2026-09-21T04:15:00Z",
    createdBy: "Neha Kapoor",
  },
];
