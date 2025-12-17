// auth.js
const SUPABASE_URL = "https://ltxrynmhihxmmzrnnduw.supabase.co";
const SUPABASE_KEY = "sb_publishable_XXXXX";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
