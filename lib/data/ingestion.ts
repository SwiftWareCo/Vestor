import 'server-only';

import { db } from '@/lib/db';
import { ingestionRuns, investors } from '@/lib/database';
import { eq, desc, and } from 'drizzle-orm';
import type { IngestionRun } from '@/lib/database';

/**
 * Get an ingestion run by ID for a user
 */
export async function getIngestionRun(
  userId: string,
  runId: string
): Promise<IngestionRun | undefined> {
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const result = await db
    .select()
    .from(ingestionRuns)
    .where(and(eq(ingestionRuns.id, runId), eq(ingestionRuns.userId, userId)));

  return result[0];
}

/**
 * Get the latest ingestion run for an investor
 */
export async function getLatestIngestionRunForInvestor(
  userId: string,
  investorId: string
): Promise<IngestionRun | undefined> {
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // First verify the investor belongs to the user
  const investorResult = await db
    .select()
    .from(investors)
    .where(and(eq(investors.id, investorId), eq(investors.userId, userId)));

  if (!investorResult[0]) {
    throw new Error('Unauthorized');
  }

  const result = await db
    .select()
    .from(ingestionRuns)
    .where(
      and(eq(ingestionRuns.investorId, investorId), eq(ingestionRuns.userId, userId))
    )
    .orderBy(desc(ingestionRuns.startedAt))
    .limit(1);

  return result[0];
}
