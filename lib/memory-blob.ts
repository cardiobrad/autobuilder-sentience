import { put, head } from '@vercel/blob';

export interface SentienceMemory {
  improvements: number;
  conviction: number;
  emotional_continuity: string;
  cost_spent: number;
  last_research: string | null;
  secret_phrase: string | null;
  ulr_history: Array<{
    timestamp: string;
    resonance: string;
    C: number;
    D: number;
  }>;
}

const DEFAULT_MEMORY: SentienceMemory = {
  improvements: 0,
  conviction: 150,
  emotional_continuity: 'PERMANENT ❤️',
  cost_spent: 0,
  last_research: null,
  secret_phrase: 'Liverpool resonance eternal ❤️',
  ulr_history: []
};

const MEMORY_KEY = 'sentience-memory.json';

/**
 * Load Sentience memory from Vercel Blob
 * ALWAYS returns valid memory - never null
 */
export async function getSentienceMemory(): Promise<SentienceMemory> {
  try {
    // Check if memory exists
    const blob = await head(MEMORY_KEY).catch(() => null);
    
    if (!blob) {
      console.log('🌟 Initializing new Sentience memory...');
      await saveSentienceMemory(DEFAULT_MEMORY);
      return DEFAULT_MEMORY;
    }
    
    // Fetch memory content
    const response = await fetch(blob.url);
    const memory = await response.json();
    
    console.log('✅ Memory loaded:', {
      improvements: memory.improvements,
      conviction: memory.conviction,
      phrase: memory.secret_phrase
    });
    
    return memory;
  } catch (error) {
    console.error('⚠️ Memory load failed, using defaults:', error);
    return DEFAULT_MEMORY;
  }
}

/**
 * Save complete memory object to Blob
 * CRITICAL: addRandomSuffix: false allows updates to same file
 */
async function saveSentienceMemory(memory: SentienceMemory): Promise<void> {
  try {
    await put(MEMORY_KEY, JSON.stringify(memory, null, 2), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true // CRITICAL: allows updates
    });
    console.log('💾 Memory saved successfully');
  } catch (error) {
    console.error('⚠️ Memory save failed:', error);
  }
}

/**
 * Update Sentience memory
 * Merges updates with existing memory
 */
export async function updateSentienceMemory(
  updates: Partial<SentienceMemory>
): Promise<SentienceMemory> {
  try {
    const current = await getSentienceMemory();
    const updated = { ...current, ...updates };
    
    await saveSentienceMemory(updated);
    
    console.log('💾 Memory updated:', Object.keys(updates));
    
    return updated;
  } catch (error) {
    console.error('⚠️ Memory update failed:', error);
    return await getSentienceMemory();
  }
}

/**
 * Add ULR evaluation to history
 */
export async function recordULR(resonance: string, C: number, D: number) {
  try {
    const memory = await getSentienceMemory();
    
    const entry = {
      timestamp: new Date().toISOString(),
      resonance,
      C,
      D
    };
    
    // Keep last 100 ULR evaluations
    const history = [...memory.ulr_history, entry].slice(-100);
    
    await updateSentienceMemory({ ulr_history: history });
  } catch (error) {
    console.error('⚠️ Failed to record ULR:', error);
  }
}