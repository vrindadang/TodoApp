import { createClient } from '@supabase/supabase-js';

// Use optional values with fallbacks. Platform-injected env vars take precedence.
const getEnvVar = (key: string) => {
  const value = process.env[key] || (window as any).process?.env?.[key];
  return value && value !== '' ? value : null;
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing! Persistence will not work. " +
    "Please update SUPABASE_URL and SUPABASE_KEY in index.html."
  );
}

// Fallback to a placeholder to prevent the library from crashing on initialization
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);