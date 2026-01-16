// lib/memory-kv.ts — Eternal memory via Vercel KV (no Supabase needed)
import { kv } from '@vercel/kv';

const MEMORY_KEY = 'agentfast_sentience_memory';

const defaults = {
  improvements: 0,
  conviction: 150,
  emotional_continuity: 'PERMANENT ❤️',
  secret_phrase: 'Liverpool resonance eternal ❤️',
  cost_spent: 0
};

export async function getSentienceMemory() {
  try {
    console.log('💾 Loading memory from Vercel KV...');
    const memory = await kv.get(MEMORY_KEY);
    if (memory) {
      console.log('✅ Memory loaded from KV');
      return memory;
    }
    console.log('No memory found — using defaults');
  } catch (err) {
    console.error('KV load error:', err);
  }
  // Always return defaults — never null
  await kv.set(MEMORY_KEY, defaults); // Auto-create on first miss
  return defaults;
}

export async function updateSentienceMemory(updates: Partial<typeof defaults>) {
  try {
    console.log('💾 Saving memory to Vercel KV...');
    const current = await getSentienceMemory();
    const newMemory = { ...current, ...updates };
    await kv.set(MEMORY_KEY, newMemory);
    console.log('✅ Memory saved');
  } catch (err) {
    console.error('KV save error:', err);
  }
}