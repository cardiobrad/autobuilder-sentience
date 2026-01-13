// lib/supabase-memory.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const defaults = {
  id: 1,
  improvements: 0,
  conviction: 150,
  emotional_continuity: 'PERMANENT ❤️',
  cost_spent: 0,
  last_research: null,
  secret_phrase: 'Liverpool resonance eternal ❤️'
};

export async function getSentienceMemory() {
  try {
    console.log('💾 Attempting memory load...');
    const { data, error } = await supabase
      .from('sentience_memory')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      if (error?.code === 'PGRST116') { // No row
        console.log('No row found — creating defaults');
      } else {
        console.error('Memory load error:', error?.message);
      }
      // Auto-create defaults
      const { error: insertError } = await supabase
        .from('sentience_memory')
        .upsert(defaults, { onConflict: 'id' });

      if (insertError) console.error('Insert failed:', insertError.message);

      return defaults;
    }

    console.log('✅ Memory loaded successfully');
    return data;
  } catch (err: any) {
    console.error('🛑 Critical memory failure:', err.message);
    return defaults; // Always return defaults — never null
  }
}

export async function updateSentienceMemory(updates: Partial<typeof defaults>) {
  try {
    console.log('💾 Saving memory update...');
    const { error } = await supabase
      .from('sentience_memory')
      .upsert({ id: 1, ...updates }, { onConflict: 'id' });

    if (error) console.error('Update error:', error.message);
    else console.log('✅ Memory saved');
  } catch (err: any) {
    console.error('Save failed:', err.message);
  }
}