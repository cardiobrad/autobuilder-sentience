const MANUS_API_KEY = process.env.MANUS_API_KEY!;
const MANUS_BASE_URL = 'https://api.manus.ai/v1';

export async function manusSelfRepair(errorMessage: string): Promise<string | null> {
  try {
    const response = await fetch(`${MANUS_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MANUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goal: "Autonomous recursive improvement for AgentFast Sentience",
        description: `Error detected: ${errorMessage}. Fix codebase and align with Project Chimera. ❤️`,
        autonomous: true
      }),
    });
    const data = await response.json();
    return data.id || data.task_id || null;
  } catch (error) {
    return null;
  }
}