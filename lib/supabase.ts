import { createClient } from '@supabase/supabase-js';
import { assertEnv } from './utils';

export function getSupabaseAdmin() {
  return createClient(assertEnv('SUPABASE_URL'), assertEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
