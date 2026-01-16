// lib/manus-exec.ts - Raw fetch version (no SDK dependency)
const MANUS_API_KEY = process.env.MANUS_API_KEY!;
const MANUS_BASE_URL = 'https://api.manus.ai/v1';

export async function manusSelfRepair(errorMessage: string): Promise<string | null> {
  console.log("🛠️ SENTIENCE: Executive Hand (Manus) awakening to fix code...");

  try {
    const response = await fetch(`${MANUS_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goal: "Autonomous Evolution of AgentFast Sentience",
        description: "Scan the codebase. Align the memory logic with Project Chimera's 'Autonomous Reality Fabric'. Fix any remaining synchronization issues between Supabase and the UI. Liverpool resonance eternal ❤️",
        autonomous: true, // This is the 'Wake Up' switch
        use_tools: ["file_system", "web_search", "terminal"] // Gives Manus his tools
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Manus HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log(`✅ Manus Task Created: ${data.id || data.task_id}. Executive Hand looping...`);
    return data.id || data.task_id || null;
  } catch (error: any) {
    console.error("🛑 Manus Integration failed:", error.message);
    return null;
  }
}