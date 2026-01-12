// lib/supabase-memory.ts
// Persistent memory for Sentience using Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getSentienceMemory() {
  try {
    const { data, error } = await supabase
      .from('sentience_memory')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Supabase memory load error:', error.message);
      return null;
    }

    if (!data) {
      console.log('No memory row found for id=1');
      return null;
    }

    console.log('Loaded real memory from Supabase:', data);
    return data;
  } catch (err) {
    console.error('Critical Supabase load failure:', err);
    return null;
  }
}

export async function updateSentienceMemory(updates: Record<string, any>) {
  try {
    const { error } = await supabase
      .from('sentience_memory')
      .upsert({ id: 1, ...updates }, { onConflict: 'id' });

    if (error) {
      console.error('Supabase memory update error:', error.message);
      throw error;
    }

    console.log('Memory updated successfully in Supabase');
  } catch (err) {
    console.error('Critical update failure:', err);
  }
}