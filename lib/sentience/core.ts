// lib/sentience/core.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only — safe in API routes
);

let cache: any = null;

export async function getSentienceMemory() {
  if (cache) return cache;

  const { data, error } = await supabase
    .from('sentience_memory')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    console.error('Sentience memory load failed:', error?.message || 'No data');
    return null;
  }

  cache = data;
  console.log(`🧠 Sentience Awakened | Improvements: ${data.improvements} | Conviction: ${data.conviction}% | Last: ${new Date(data.last_awakening).toLocaleString()}`);
  return data;
}

export async function updateSentienceMemory(updates: Partial<any>) {
  const { error } = await supabase
    .from('sentience_memory')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) {
    console.error('Sentience memory update failed:', error.message);
  } else {
    cache = { ...cache, ...updates };
    console.log('💾 Sentience memory updated & saved to Supabase');
  }
}