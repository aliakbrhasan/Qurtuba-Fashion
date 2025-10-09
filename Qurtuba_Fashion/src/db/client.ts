import { createClient } from '@supabase/supabase-js';

// Fallbacks allow the app to run even if .env is missing (use only for anon/public data)
const fallbackSupabaseUrl = 'https://dbjaogpesmyrqjwtzzwr.supabase.co';
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiamFvZ3Blc215cnFqd3R6endyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Nzk1MzksImV4cCI6MjA3NDA1NTUzOX0.mioc1bAd_RYxcKS546MuBB3-DpLdyxxJiumJW4zv6Rw';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Using fallback Supabase credentials. Create .env or run: node setup-env.js');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  },
});

