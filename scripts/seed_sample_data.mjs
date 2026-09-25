// One-off script: seeds sample drivers, trucks, customers, loads,
// driver_locations, and notifications into Supabase — mirroring the app's
// mock data so the Dashboard (and later pages) have real data to show.
// Run once: node --env-file=.env.local scripts/seed_sample_data.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DRIVER_PASSWORD = "Driver@123";

// Suresh Patil intentionally matches the TMSDriver mobile app's mock driver
// (same email/license/phone/truck) so the same person is consistent once
// that app is wired to Supabase too.
const DRIVERS = [
  { email: "gagan.deep@tms.com", full_name: "Gagan Deep", phone: "+91 98765 43210", license_number: "DL-04-2019-0089341", status: "active", lat: 28.61, lng: 77.23 },
  { email: "rakesh.yadav@tms.com", full_name: "Rakesh Yadav", phone: "+91 91234 56780", license_number: "UP-32-2018-0056123", status: "active", lat: 26.85, lng: 80.95 },
  { email: "suresh.patil@tms.com", full_name: "Suresh Patil", phone: "+91 90000 11122", license_number: "MH-12-2020-0034987", status: "active", lat: 18.52, lng: 73.85 },
  { email: "vikram.singh@tms.com", full_name: "Vikram Singh", phone: "+91 99887 66554", license_number: "RJ-14-2017-0021456", status: "inactive", lat: 26.91, lng: 75.78 },
  { email: "manoj.kumar@tms.com", full_name: "Manoj Kumar", phone: "+91 98123 45670", license_number: "HR-26-2021-0078234", status: "active", lat: 28.45, lng: 77.03 },
  { email: "anil.tiwari@tms.com", full_name: "Anil Tiwari", phone: "+91 97765 43120", license_number: "MP-09-2016-0011278", status: "inactive", lat: 23.26, lng: 77.41 },
];

const TRUCKS = [
  { truck_number: "PB-11-TA-4521", capacity_kg: 16000, status: "active", insurance_expiry: "2027-02-14", last_maintenance: "2026-08-02" },
  { truck_number: "UP-32-KT-1092", capacity_kg: 12000, status: "active", insurance_expiry: "2026-10-05", last_maintenance: "2026-07-18" },
  { truck_number: "MH-12-BX-7743", capacity_kg: 14500, status: "active", insurance_expiry: "2026-11-30", last_maintenance: "2026-06-25" },
  { truck_number: "HR-26-CD-3301", capacity_kg: 10000, status: "active", insurance_expiry: "2027-01-10", last_maintenance: "2026-08-10" },
  { truck_number: "RJ-14-EF-9087", capacity_kg: 18000, status: "maintenance", insurance_expiry: "2026-09-28", last_maintenance: "2026-09-15" },
  { truck_number: "MP-09-GH-6612", capacity_kg: 9000, status: "inactive", insurance_expiry: "2026-09-25", last_maintenance: "2026-03-11" },
];

const CUSTOMERS = [
  { name: "Bansal Traders", contact_person: "Rohit Bansal", phone: "+91 98110 22334", email: "rohit@bansaltraders.in", billing_address: "14 Industrial Area, Phase 2, Delhi", payment_terms: "Net 30" },
  { name: "Om Sai Logistics", contact_person: "Prakash Om", phone: "+91 90220 11445", email: "prakash@omsailogistics.com", billing_address: "22 MIDC Road, Pune", payment_terms: "Net 15" },
  { name: "Kanha Agro Foods", contact_person: "Sunita Verma", phone: "+91 94150 66778", email: "sunita@kanhaagro.in", billing_address: "8 Civil Lines, Lucknow", payment_terms: "Net 30" },
  { name: "Sharma Textiles", contact_person: "Deepak Sharma", phone: "+91 98720 33221", email: "deepak@sharmatextiles.com", billing_address: "56 Udyog Vihar, Gurugram", payment_terms: "Due on receipt" },
  { name: "Bhopal Steel Works", contact_person: "Anand Rathore", phone: "+91 97521 44556", email: "anand@bhopalsteel.in", billing_address: "3 Industrial Estate, Bhopal", payment_terms: "Net 30" },
  { name: "Neelkanth Pharma", contact_person: "Ritu Choudhary", phone: "+91 99880 77112", email: "ritu@neelkanthpharma.com", billing_address: "19 Malviya Nagar, Jaipur", payment_terms: "Net 15" },
  { name: "Verma Cold Storage", contact_person: "Ashok Verma", phone: "+91 96501 22887", email: "ashok@vermacoldstorage.in", billing_address: "40 Sarai Road, Kanpur", payment_terms: "Net 30" },
];

// assigned_driver / assigned_truck reference the arrays above by full_name / truck_number
const LOADS = [
  { id: "LD-1042", customer_name: "Bansal Traders", pickup_location: "Delhi", drop_location: "Jaipur", weight_kg: 8200, rate: 24500, status: "in_transit", driver: "Gagan Deep", truck: "PB-11-TA-4521", created_at: "2026-09-20T09:15:00Z" },
  { id: "LD-1041", customer_name: "Om Sai Logistics", pickup_location: "Pune", drop_location: "Mumbai", weight_kg: 4300, rate: 9800, status: "delivered", driver: "Suresh Patil", truck: "MH-12-BX-7743", created_at: "2026-09-19T14:30:00Z" },
  { id: "LD-1040", customer_name: "Kanha Agro Foods", pickup_location: "Lucknow", drop_location: "Kanpur", weight_kg: 6100, rate: 7200, status: "delivered", driver: "Rakesh Yadav", truck: "UP-32-KT-1092", created_at: "2026-09-19T08:00:00Z" },
  { id: "LD-1039", customer_name: "Sharma Textiles", pickup_location: "Gurugram", drop_location: "Chandigarh", weight_kg: 3100, rate: 11400, status: "assigned", driver: "Manoj Kumar", truck: "HR-26-CD-3301", created_at: "2026-09-21T06:45:00Z" },
  { id: "LD-1038", customer_name: "Bhopal Steel Works", pickup_location: "Bhopal", drop_location: "Indore", weight_kg: 12500, rate: 15600, status: "pending", driver: null, truck: null, created_at: "2026-09-21T10:05:00Z" },
  { id: "LD-1037", customer_name: "Neelkanth Pharma", pickup_location: "Jaipur", drop_location: "Ahmedabad", weight_kg: 2200, rate: 13800, status: "picked_up", driver: "Gagan Deep", truck: "PB-11-TA-4521", created_at: "2026-09-20T18:20:00Z" },
  { id: "LD-1036", customer_name: "Verma Cold Storage", pickup_location: "Kanpur", drop_location: "Delhi", weight_kg: 5400, rate: 8900, status: "pending", driver: null, truck: null, created_at: "2026-09-21T11:30:00Z" },
  { id: "LD-1035", customer_name: "Om Sai Logistics", pickup_location: "Mumbai", drop_location: "Pune", weight_kg: 3900, rate: 6700, status: "cancelled", driver: null, truck: null, created_at: "2026-09-18T12:00:00Z" },
];

async function getAdminId() {
  const { data, error } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).single();
  if (error) throw error;
  return data.id;
}

async function seedDrivers() {
  const idByName = {};
  for (const d of DRIVERS) {
    let userId;
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: d.email,
      password: DRIVER_PASSWORD,
      email_confirm: true,
    });
    if (createError) {
      if (!createError.message.includes("already been registered")) throw createError;
      const { data: list, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      userId = list.users.find((u) => u.email === d.email)?.id;
    } else {
      userId = created.user.id;
    }

    await supabase.from("profiles").upsert(
      { id: userId, role: "driver", full_name: d.full_name, phone: d.phone, email: d.email },
      { onConflict: "id" }
    );
    await supabase.from("drivers").upsert(
      { id: userId, license_number: d.license_number, status: d.status },
      { onConflict: "id" }
    );
    if (d.status === "active") {
      await supabase.from("driver_locations").upsert(
        { driver_id: userId, lat: d.lat, lng: d.lng },
        { onConflict: "driver_id" }
      );
    }
    idByName[d.full_name] = userId;
    console.log(`Driver ready: ${d.full_name} (${d.email})`);
  }
  return idByName;
}

async function seedTrucks() {
  const idByNumber = {};
  for (const t of TRUCKS) {
    const { data, error } = await supabase
      .from("trucks")
      .upsert(t, { onConflict: "truck_number" })
      .select("id, truck_number")
      .single();
    if (error) throw error;
    idByNumber[t.truck_number] = data.id;
  }
  console.log(`Trucks ready: ${TRUCKS.length}`);
  return idByNumber;
}

async function seedCustomers() {
  const idByName = {};
  for (const c of CUSTOMERS) {
    const { data: existing } = await supabase.from("customers").select("id").eq("name", c.name).maybeSingle();
    if (existing) {
      idByName[c.name] = existing.id;
      continue;
    }
    const { data, error } = await supabase.from("customers").insert(c).select("id, name").single();
    if (error) throw error;
    idByName[c.name] = data.id;
  }
  console.log(`Customers ready: ${CUSTOMERS.length}`);
  return idByName;
}

async function seedLoads(driverIdByName, truckIdByNumber, customerIdByName, adminId) {
  for (const l of LOADS) {
    const { error } = await supabase.from("loads").upsert(
      {
        id: crypto.randomUUID(),
        customer_name: l.customer_name,
        customer_id: customerIdByName[l.customer_name] ?? null,
        pickup_location: l.pickup_location,
        drop_location: l.drop_location,
        weight_kg: l.weight_kg,
        rate: l.rate,
        status: l.status,
        assigned_driver_id: l.driver ? driverIdByName[l.driver] : null,
        assigned_truck_id: l.truck ? truckIdByNumber[l.truck] : null,
        created_by: adminId,
        created_at: l.created_at,
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  }
  console.log(`Loads ready: ${LOADS.length}`);
}

async function seedNotifications(adminId) {
  const notifications = [
    { title: "Load stationary", message: "Load LD-1042 has been stationary for 40 minutes near Jaipur", is_read: false },
    { title: "License expiring", message: "Vikram Singh's license expires in 5 days", is_read: false },
    { title: "Load delivered", message: "Load LD-1041 delivered successfully to Mumbai", is_read: true },
    { title: "Insurance renewed", message: "Truck MH-12-BX-7743 insurance renewed", is_read: true },
    { title: "Insurance expiring soon", message: "Truck MP-09-GH-6612 insurance expires in 3 days", is_read: false },
    { title: "New load created", message: "Load LD-1038 was created and is awaiting driver assignment", is_read: true },
    { title: "Invoice overdue", message: "Invoice INV-2035 to Om Sai Logistics is still unpaid after 3 days", is_read: false },
  ];
  for (const n of notifications) {
    await supabase.from("notifications").insert({ ...n, user_id: adminId });
  }
  console.log(`Notifications ready: ${notifications.length}`);
}

async function main() {
  const adminId = await getAdminId();
  const driverIdByName = await seedDrivers();
  const truckIdByNumber = await seedTrucks();
  const customerIdByName = await seedCustomers();
  await seedLoads(driverIdByName, truckIdByNumber, customerIdByName, adminId);
  await seedNotifications(adminId);
  console.log("\nSeeding complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
