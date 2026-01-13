import { NextRequest, NextResponse } from 'next/server';
import { neonAuth } from '@neondatabase/auth/next/server';
import { runIngestInvestorWorkflow } from '@/lib/workflows/ingest-investor.workflow';
import { db } from '@/lib/db';
import { ingestionRuns } from '@/lib/database';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { user } = await neonAuth();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { runId } = body;

    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 });
    }

    // Verify the run belongs to the user
    const [run] = await db
      .select()
      .from(ingestionRuns)
      .where(and(eq(ingestionRuns.id, runId), eq(ingestionRuns.userId, user.id)));

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Run the workflow
    await runIngestInvestorWorkflow({
      runId: run.id,
      investorId: run.investorId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Workflow error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Workflow failed' },
      { status: 500 }
    );
  }
}
