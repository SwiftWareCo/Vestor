import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  customType,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * pgvector extension setup (run once in your database):
 * CREATE EXTENSION IF NOT EXISTS vector;
 */

// Custom vector type for pgvector
export const vector = customType<{ data: number[]; dpiData: string }>({
  dataType(config) {
    // @ts-expect-error - config dimensions is passed at runtime
    const dimensions = config?.dimensions;
    return dimensions ? `vector(${dimensions})` : 'vector';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: unknown): number[] {
    // Handle the case where value comes as a string like '[0.1,0.2,0.3]'
    if (typeof value !== 'string') {
      return [];
    }
    const cleaned = value.replace(/[\[\]]/g, '');
    return cleaned.split(',').map(Number);
  },
});

// Investor status enum
export const investorStatusEnum = pgEnum('investor_status', [
  'draft',
  'processing',
  'needs_review',
  'ready',
  'failed',
]);

/**
 * Investors table
 *
 * Stores investor profiles extracted from documents.
 * user_id references neon_auth.users_sync(id)
 */
export const investors = pgTable('investors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name'),
  firm: text('firm'),
  website: text('website'),
  status: investorStatusEnum('status').default('draft').notNull(),
  thesisSummary: text('thesis_summary'),
  checkSizeMin: integer('check_size_min'),
  checkSizeMax: integer('check_size_max'),
  stages: text('stages').array(),
  geographies: text('geographies').array(),
  focusSectors: text('focus_sectors').array(),
  excludedSectors: text('excluded_sectors').array(),
  coverageScore: integer('coverage_score').notNull().default(0),
  missingFields: text('missing_fields').array(),
  reviewNotes: text('review_notes'),
  embeddingModel: text('embedding_model'),
  embeddingDim: integer('embedding_dim'),
  thesisEmbedding: vector('thesis_embedding'),
  sectorsEmbedding: vector('sectors_embedding'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Drizzle-zod schemas
export const insertInvestorSchema = createInsertSchema(investors, {
  name: z.string().optional(),
  firm: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  stages: z.array(z.string()).optional(),
  geographies: z.array(z.string()).optional(),
  focusSectors: z.array(z.string()).optional(),
  excludedSectors: z.array(z.string()).optional(),
});

export const selectInvestorSchema = createSelectSchema(investors);

// Inferred types
export type Investor = typeof investors.$inferSelect;
export type NewInvestor = typeof investors.$inferInsert;
export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type SelectInvestor = z.infer<typeof selectInvestorSchema>;

// Form schema for creating investors
export const createInvestorSchema = z.object({
  name: z.string().optional(),
  firm: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export type CreateInvestorInput = z.infer<typeof createInvestorSchema>;

// Form schema for updating investor profile fields
export const updateInvestorProfileSchema = z.object({
  name: z.string().optional(),
  firm: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  thesisSummary: z.string().optional(),
  checkSizeMin: z.number().int().positive().optional().nullable(),
  checkSizeMax: z.number().int().positive().optional().nullable(),
  stages: z.array(z.string()).optional(),
  geographies: z.array(z.string()).optional(),
  focusSectors: z.array(z.string()).optional(),
  excludedSectors: z.array(z.string()).optional(),
  reviewNotes: z.string().optional(),
});

export type UpdateInvestorProfileInput = z.infer<typeof updateInvestorProfileSchema>;
