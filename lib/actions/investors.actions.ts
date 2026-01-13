'use server';

import { db } from '@/lib/db';
import {
  investors,
  documents,
  createInvestorSchema,
  addUrlDocumentSchema,
  addPdfDocumentSchema,
  updateInvestorProfileSchema,
  type UpdateInvestorProfileInput,
} from '@/lib/database';
import { computeCoverage, needsReview } from '@/lib/ingestion/coverage/computeCoverage';
import { neonAuth } from '@neondatabase/auth/next/server';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { createHash } from 'crypto';

/**
 * Create a hash from a string for content deduplication
 */
function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Normalize a URL by removing trailing slashes and converting to lowercase
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash from pathname
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString().toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/+$/, '');
  }
}

/**
 * Create a new investor profile
 */
export async function createInvestorAction(input: {
  name?: string;
  firm?: string;
  website?: string;
}) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Validate input
  const validationResult = createInvestorSchema.safeParse(input);
  if (!validationResult.success) {
    throw new Error(
      'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
    );
  }

  const { name, firm, website } = validationResult.data;

  const [newInvestor] = await db
    .insert(investors)
    .values({
      userId: user.id,
      name: name?.trim() || null,
      firm: firm?.trim() || null,
      website: website?.trim() || null,
      status: 'draft',
    })
    .returning();

  revalidatePath('/investors');

  return newInvestor;
}

/**
 * Add a URL document to an investor
 */
export async function addInvestorUrlDocumentAction(input: {
  investorId: string;
  url: string;
}) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Validate input
  const validationResult = addUrlDocumentSchema.safeParse(input);
  if (!validationResult.success) {
    throw new Error(
      'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
    );
  }

  const { investorId, url } = validationResult.data;

  // Verify investor belongs to user
  const [investor] = await db
    .select()
    .from(investors)
    .where(and(eq(investors.id, investorId), eq(investors.userId, user.id)));

  if (!investor) {
    throw new Error('Investor not found or unauthorized');
  }

  const normalizedUrl = normalizeUrl(url);
  const contentHash = hashString(normalizedUrl);

  // Check for duplicate document
  const [existingDoc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.userId, user.id), eq(documents.contentHash, contentHash)));

  if (existingDoc) {
    throw new Error('This URL has already been added');
  }

  const [newDocument] = await db
    .insert(documents)
    .values({
      investorId,
      userId: user.id,
      type: 'url',
      url: normalizedUrl,
      contentHash,
      status: 'queued',
    })
    .returning();

  revalidatePath('/investors');
  revalidatePath(`/investors/${investorId}`);

  return newDocument;
}

/**
 * Add a PDF document to an investor
 */
export async function addInvestorPdfDocumentAction(input: {
  investorId: string;
  storageKey: string;
}) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Validate input
  const validationResult = addPdfDocumentSchema.safeParse(input);
  if (!validationResult.success) {
    throw new Error(
      'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
    );
  }

  const { investorId, storageKey } = validationResult.data;

  // Verify investor belongs to user
  const [investor] = await db
    .select()
    .from(investors)
    .where(and(eq(investors.id, investorId), eq(investors.userId, user.id)));

  if (!investor) {
    throw new Error('Investor not found or unauthorized');
  }

  const contentHash = hashString(storageKey);

  // Check for duplicate document
  const [existingDoc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.userId, user.id), eq(documents.contentHash, contentHash)));

  if (existingDoc) {
    throw new Error('This PDF has already been added');
  }

  const [newDocument] = await db
    .insert(documents)
    .values({
      investorId,
      userId: user.id,
      type: 'pdf',
      storageKey,
      contentHash,
      status: 'queued',
    })
    .returning();

  revalidatePath('/investors');
  revalidatePath(`/investors/${investorId}`);

  return newDocument;
}

/**
 * Update investor profile fields
 */
export async function updateInvestorProfileAction(
  investorId: string,
  input: UpdateInvestorProfileInput
) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Validate input
  const validationResult = updateInvestorProfileSchema.safeParse(input);
  if (!validationResult.success) {
    throw new Error(
      'Invalid input: ' + validationResult.error.issues.map((e) => e.message).join(', ')
    );
  }

  // Verify investor belongs to user
  const [investor] = await db
    .select()
    .from(investors)
    .where(and(eq(investors.id, investorId), eq(investors.userId, user.id)));

  if (!investor) {
    throw new Error('Investor not found or unauthorized');
  }

  const data = validationResult.data;

  // Update investor profile
  const [updatedInvestor] = await db
    .update(investors)
    .set({
      name: data.name?.trim() || investor.name,
      firm: data.firm?.trim() || investor.firm,
      website: data.website?.trim() || investor.website,
      thesisSummary: data.thesisSummary?.trim() || investor.thesisSummary,
      checkSizeMin: data.checkSizeMin ?? investor.checkSizeMin,
      checkSizeMax: data.checkSizeMax ?? investor.checkSizeMax,
      stages: data.stages && data.stages.length > 0 ? data.stages : investor.stages,
      geographies:
        data.geographies && data.geographies.length > 0
          ? data.geographies
          : investor.geographies,
      focusSectors:
        data.focusSectors && data.focusSectors.length > 0
          ? data.focusSectors
          : investor.focusSectors,
      excludedSectors:
        data.excludedSectors && data.excludedSectors.length > 0
          ? data.excludedSectors
          : investor.excludedSectors,
      reviewNotes: data.reviewNotes?.trim() ?? investor.reviewNotes,
      updatedAt: new Date(),
    })
    .where(eq(investors.id, investorId))
    .returning();

  // Recalculate coverage
  const { score, missingFields } = computeCoverage(updatedInvestor);
  const status = needsReview(score) ? 'needs_review' : 'ready';

  await db
    .update(investors)
    .set({
      coverageScore: score,
      missingFields: missingFields.length > 0 ? missingFields : null,
      status,
    })
    .where(eq(investors.id, investorId));

  revalidatePath('/investors');
  revalidatePath(`/investors/${investorId}`);
  revalidatePath(`/investors/${investorId}/review`);

  return { ...updatedInvestor, coverageScore: score, status };
}
