import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run(label, fn) {
  try {
    const { data, error } = await fn();
    console.log(`\n=== ${label} ===`);
    if (error) {
      console.log("ERROR:", error.message);
    } else {
      console.log(JSON.stringify(data, null, 2).slice(0, 1500));
    }
  } catch (e) {
    console.log(`\n=== ${label} ===`);
    console.log("THROWN:", e.message);
  }
}

await run("drivers with profiles", () =>
  supabase.from("drivers").select("id, status, license_number, profiles(full_name, phone)").limit(3)
);

await run("loads with driver name via drivers->profiles", () =>
  supabase
    .from("loads")
    .select("id, customer_name, status, assigned_driver_id, assigned_truck_id, drivers(profiles(full_name))")
    .limit(3)
);

await run("trucks", () => supabase.from("trucks").select("id, truck_number, status").limit(3));

await run("driver_locations", () => supabase.from("driver_locations").select("*").limit(3));

await run("notifications", () => supabase.from("notifications").select("*").limit(3));

await run("profiles admin", () => supabase.from("profiles").select("id, role, full_name").eq("role", "admin"));
