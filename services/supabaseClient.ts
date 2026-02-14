import { createClient } from '@supabase/supabase-js';

// Environment variables are injected by the platform. 
// We use fallbacks to prevent initialization crashes if they are temporarily missing.
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_KEY || 'placeholder';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn("Supabase credentials missing. Data will not save to the cloud.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);