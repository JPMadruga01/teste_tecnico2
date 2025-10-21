import { jwtVerify } from 'jose';
import { supabase } from './supabase';

export async function getUserIdFromToken(token: string | null): Promise<string | null> {
  if (!token) return null;

  // If we have a local secret, try to verify token locally for speed
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (secret) {
    try {
      const encoder = new TextEncoder();
      const { payload } = await jwtVerify(token, encoder.encode(secret));
      // Supabase stores sub as user id
      if (payload && typeof payload.sub === 'string') return payload.sub;
    } catch (err) {
      // fallthrough to server-side verification
    }
  }

  // Fallback: ask Supabase to decode the token
  try {
    const { data } = await supabase.auth.getUser(token as string);
    return (data as any)?.user?.id ?? null;
  } catch {
    return null;
  }
}
