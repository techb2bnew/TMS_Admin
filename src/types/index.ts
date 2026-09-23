export type LoadStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type DriverStatus = "active" | "inactive";

export type Load = {
  id: string;
  customer_name: string;
  pickup_location: string;
  drop_location: string;
  weight_kg: number;
  rate: number;
  status: LoadStatus;
  assigned_driver: string | null;
  created_at: string;
};

export type Driver = {
  id: string;
  full_name: string;
  phone: string;
  license_number: string;
  status: DriverStatus;
  deliveries_count: number;
  joined_at: string;
  truck_number: string | null;
  location: { lat: number; lng: number; label: string };
};

export type TruckStatus = "active" | "maintenance" | "inactive";

export type Truck = {
  id: string;
  truck_number: string;
  capacity_kg: number;
  status: TruckStatus;
  insurance_expiry: string;
  last_maintenance: string;
  assigned_driver: string | null;
};

export type InvoiceStatus = "paid" | "unpaid";

export type Invoice = {
  id: string;
  load_id: string;
  customer_name: string;
  amount: number;
  status: InvoiceStatus;
  created_at: string;
};

export type Settlement = {
  id: string;
  load_id: string;
  driver_name: string;
  amount: number;
  status: InvoiceStatus;
  created_at: string;
};

export type NotificationType = "delay" | "document" | "delivery" | "maintenance" | "system";
export type NotificationLevel = "info" | "warning" | "success" | "critical";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  level: NotificationLevel;
  read: boolean;
  created_at: string;
};
