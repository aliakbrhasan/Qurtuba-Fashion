import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please create a .env file with:');
  console.error('VITE_SUPABASE_URL=https://dbjaogpesmyrqjwtzzwr.supabase.co');
  console.error('VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  console.error('\nRun: node setup-env.js to create the .env file automatically');
  throw new Error('Missing Supabase environment variables. Please run: node setup-env.js');
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

