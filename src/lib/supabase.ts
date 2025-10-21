import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side admin client (use only on the server). Create if SUPABASE_SERVICE_ROLE is provided.
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE && process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE)
  : null;

export const getAdminClient = () => supabaseAdmin;
