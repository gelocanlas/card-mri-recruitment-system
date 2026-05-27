import { createClient } from "@supabase/supabase-js";

// Hardcoded publishable Supabase credentials to auto-initiate on Vercel without env configurations
const supabaseUrl = "https://nhspkwtjuybtwwdweqfy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oc3Brd3RqdXlidHd3ZHdlcWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjEyNzAsImV4cCI6MjA5NDg5NzI3MH0.lkIL23WuMF-DC9LDRZeNlP_25ZDbCF95xoU3UZgoMzw";

export const isSupabaseConfigured = true;

const client = createClient(supabaseUrl, supabaseAnonKey);

export const getSupabaseClient = () => {
  return client;
};
