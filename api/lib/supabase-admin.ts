import { createClient } from '@supabase/supabase-js';
import { AppConfig } from './config.js';

export const supabaseAdmin = createClient(
  AppConfig.supabase.url || '',
  AppConfig.supabase.serviceRoleKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
