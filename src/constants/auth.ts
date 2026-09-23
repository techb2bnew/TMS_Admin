// Static admin login — intentional. This stays hardcoded even after the
// rest of the app moves off mock data to Supabase.
export const STATIC_ADMIN_CREDENTIALS = {
  email: "admin@tms.com",
  password: "Admin@123",
};

export const AUTH_COOKIE_NAME = "tms_admin_auth";
