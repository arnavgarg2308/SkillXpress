// auth.js
const SUPABASE_URL = "https://ltxrynmhihxmmzrnnduw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0eHJ5bm1oaWh4bW16cm5uZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDAxNTksImV4cCI6MjA4MTQ3NjE1OX0.jpxJbr3by-75XRCY0lC9gDuU3_cLuVk6fYRzWP2f-N0";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
