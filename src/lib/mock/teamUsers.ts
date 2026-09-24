import type { TeamUser } from "@/types";

export const mockTeamUsers: TeamUser[] = [
  {
    id: "u1",
    name: "Shubham Bhatia",
    email: "shubham@base2brand.com",
    role: "Admin",
    status: "Active",
    addedAt: "2025-05-01",
  },
  {
    id: "u2",
    name: "Neha Kapoor",
    email: "neha@base2brand.com",
    role: "Dispatcher",
    status: "Active",
    addedAt: "2025-08-14",
  },
  {
    id: "u3",
    name: "Arjun Mehta",
    email: "arjun@base2brand.com",
    role: "Accountant",
    status: "Active",
    addedAt: "2025-11-02",
  },
  {
    id: "u4",
    name: "Priya Nair",
    email: "priya@base2brand.com",
    role: "Dispatcher",
    status: "Invited",
    addedAt: "2026-09-10",
  },
  {
    id: "u5",
    name: "Karan Malhotra",
    email: "karan@base2brand.com",
    role: "Accountant",
    status: "Invited",
    addedAt: "2026-09-18",
  },
];
