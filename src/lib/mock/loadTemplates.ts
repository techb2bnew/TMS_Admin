import type { LoadTemplate } from "@/types";

export const mockLoadTemplates: LoadTemplate[] = [
  {
    id: "lt1",
    name: "Delhi → Jaipur (Bansal Traders)",
    customerName: "Bansal Traders",
    pickupLocation: "Delhi",
    dropLocation: "Jaipur",
    defaultRate: 24500,
  },
  {
    id: "lt2",
    name: "Pune → Mumbai (Om Sai Logistics)",
    customerName: "Om Sai Logistics",
    pickupLocation: "Pune",
    dropLocation: "Mumbai",
    defaultRate: 9800,
  },
  {
    id: "lt3",
    name: "Lucknow → Kanpur (Kanha Agro Foods)",
    customerName: "Kanha Agro Foods",
    pickupLocation: "Lucknow",
    dropLocation: "Kanpur",
    defaultRate: 7200,
  },
  {
    id: "lt4",
    name: "Gurugram → Chandigarh (Sharma Textiles)",
    customerName: "Sharma Textiles",
    pickupLocation: "Gurugram",
    dropLocation: "Chandigarh",
    defaultRate: 11400,
  },
  {
    id: "lt5",
    name: "Jaipur → Ahmedabad (Neelkanth Pharma)",
    customerName: "Neelkanth Pharma",
    pickupLocation: "Jaipur",
    dropLocation: "Ahmedabad",
    defaultRate: 13800,
  },
];
