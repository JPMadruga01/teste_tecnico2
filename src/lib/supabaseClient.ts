"use client";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // In development we may not have envs; avoid throwing so the app can still render.
  // Calls that need auth will fail until the user configures envs.
  // eslint-disable-next-line no-console
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabaseClient: SupabaseClient = createClient(url ?? '', anonKey ?? '');

export const signInWithEmail = (email: string) =>
  supabaseClient.auth.signInWithOtp({ email });

export const signOut = () => supabaseClient.auth.signOut();

export const getSession = async () => {
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
};

export default supabaseClient;
