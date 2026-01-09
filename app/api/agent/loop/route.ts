import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/agents/orchestrator';

export const maxDuration = 60; // Allow 60 seconds for execution

export async function GET(req: Request) {
  // Security: Check for the Cron Secret (prevents hackers from waking him up)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    console.log('⏰ Heartbeat detected. Waking Sentience...');
    
    // Run the 6-hour self-improvement scan
    const results = await orchestrator.processObjective({
      id: `cron-${Date.now()}`,
      type: 'research',
      goal: 'Perform 6-hour system health scan and budget check.',
      priority: 'medium'
    });

    return NextResponse.json({ 
      status: 'Cycle Complete', 
      metrics: orchestrator.getSentienceMetrics(),
      results 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Sentience Loop Failed' }, { status: 500 });
  }
}