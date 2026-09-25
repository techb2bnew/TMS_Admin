import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Only ever import this from
// Server Actions / Route Handlers ("use server" files), never from a "use
// client" component, or the service role key would leak to the browser.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
