'use server';

import { db } from '@/lib/db';
import { investors, ingestionRuns } from '@/lib/database';
import { neonAuth } from '@neondatabase/auth/next/server';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { runIngestInvestorWorkflow } from '@/lib/workflows/ingest-investor.workflow';

const startIngestionSchema = z.object({
  investorId: z.string().uuid(),
});

/**
 * Start an ingestion run for an investor
 */
export async function startInvestorIngestionAction(input: { investorId: string }) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Validate input
  const validationResult = startIngestionSchema.safeParse(input);
  if (!validationResult.success) {
    throw new Error(
      'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
    );
  }

  const { investorId } = validationResult.data;

  // Verify investor belongs to user
  const [investor] = await db
    .select()
    .from(investors)
    .where(and(eq(investors.id, investorId), eq(investors.userId, user.id)));

  if (!investor) {
    throw new Error('Investor not found or unauthorized');
  }

  // Update investor status to processing
  await db
    .update(investors)
    .set({
      status: 'processing',
      updatedAt: new Date(),
    })
    .where(eq(investors.id, investorId));

  // Create a new ingestion run
  const [newRun] = await db
    .insert(ingestionRuns)
    .values({
      investorId,
      userId: user.id,
      status: 'running',
      stepState: {
        currentStep: 'load',
        completedSteps: [],
        documentCounts: {
          total: 0,
          processed: 0,
          failed: 0,
        },
        lastUpdated: new Date().toISOString(),
      },
    })
    .returning();

  // Run the workflow in the background (don't await to avoid blocking the UI)
  runIngestInvestorWorkflow({
    runId: newRun.id,
    investorId,
    userId: user.id,
  }).then(() => {
    // Workflow completed successfully
  }).catch((error) => {
    console.error('Workflow failed:', error);
  });

  revalidatePath('/investors');
  revalidatePath(`/investors/${investorId}`);

  return { runId: newRun.id };
}
