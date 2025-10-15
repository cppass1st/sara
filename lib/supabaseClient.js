// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 👇 подсказки в dev
if (typeof window !== 'undefined') {
  if (!supabaseUrl)  console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL is EMPTY');
  if (!supabaseAnonKey) console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is EMPTY');
}
// Стандартная инициализация клиента Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
