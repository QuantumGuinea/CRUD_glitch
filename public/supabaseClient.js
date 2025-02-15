import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabase = createClient(
  "https://kjlypjubepptwtfjxxpy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqbHlwanViZXBwdHd0Zmp4eHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NDQyNTEsImV4cCI6MjA1NTAyMDI1MX0.f5GXW2J7c2bFItWRNgJtEA9tUEGANoLtyGSflyHqHsk",
  { auth: { persistSession: true } }
);