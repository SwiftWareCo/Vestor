import 'server-only';

import { db } from '@/lib/db';
import { investors, documents, investorSections } from '@/lib/database';
import { eq, desc, and, asc } from 'drizzle-orm';
import type { Investor, Document, InvestorSection } from '@/lib/database';

/**
 * Get all investors for a user, ordered by updated_at desc
 */
export async function getInvestorsForUser(userId: string): Promise<Investor[]> {
  if (!userId) {
    throw new Error('Unauthorized');
  }

  return await db
    .select()
    .from(investors)
    .where(eq(investors.userId, userId))
    .orderBy(desc(investors.updatedAt));
}

/**
 * Get a single investor by ID for a user
 */
export async function getInvestorByIdForUser(
  userId: string,
  investorId: string
): Promise<Investor | undefined> {
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const result = await db
    .select()
    .from(investors)
    .where(and(eq(investors.id, investorId), eq(investors.userId, userId)));

  return result[0];
}

/**
 * Get all documents for an investor
 */
export async function getInvestorDocuments(
  userId: string,
  investorId: string
): Promise<Document[]> {
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // First verify the investor belongs to the user
  const investor = await getInvestorByIdForUser(userId, investorId);
  if (!investor) {
    throw new Error('Unauthorized');
  }

  return await db
    .select()
    .from(documents)
    .where(eq(documents.investorId, investorId))
    .orderBy(desc(documents.createdAt));
}

/**
 * Get all sections for an investor, ordered by document and chunk index
 */
export async function getInvestorSections(
  userId: string,
  investorId: string
): Promise<InvestorSection[]> {
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // First verify the investor belongs to the user
  const investor = await getInvestorByIdForUser(userId, investorId);
  if (!investor) {
    throw new Error('Unauthorized');
  }

  return await db
    .select()
    .from(investorSections)
    .where(eq(investorSections.investorId, investorId))
    .orderBy(asc(investorSections.documentId), asc(investorSections.chunkIndex));
}
