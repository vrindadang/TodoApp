
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Data will not save to the cloud. Please set SUPABASE_URL and SUPABASE_KEY in environment variables.");
}

// Fallback to placeholder values to prevent 'supabaseUrl is required' error during initialization.
// If the URL is invalid, actual database requests will fail gracefully in the application.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
