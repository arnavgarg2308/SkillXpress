// auth.js
const SUPABASE_URL = "https://ltxrynmhihxmmzrnnduw.supabase.co";
const SUPABASE_KEY = "sb_publishable_fjjEdhlNVgCsfdKb5k_9Hg_zlR0HS4L";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
