import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { investors, vector } from './investors.schema';
import { documents } from './documents.schema';

// Section type enum
export const sectionTypeEnum = pgEnum('section_type', [
  'thesis',
  'criteria',
  'portfolio',
  'team',
  'general',
]);

/**
 * Investor Sections table
 *
 * Stores chunked content from documents for semantic search and evidence display.
 */
export const investorSections = pgTable(
  'investor_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    investorId: uuid('investor_id')
      .notNull()
      .references(() => investors.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    sectionType: sectionTypeEnum('section_type').notNull(),
    title: text('title'),
    content: text('content').notNull(),
    contentHash: text('content_hash').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    sourceLocator: jsonb('source_locator').$type<{
      url?: string;
      page?: number;
      lineStart?: number;
      lineEnd?: number;
    }>(),
    embedding: vector('embedding'),
    embeddingModel: text('embedding_model'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Index for querying sections by investor
    index('investor_sections_investor_id_idx').on(table.investorId),
    // Index for querying sections by document
    index('investor_sections_document_id_idx').on(table.documentId),
    // Unique constraint to prevent duplicate sections
    uniqueIndex('investor_sections_unique_idx').on(
      table.investorId,
      table.documentId,
      table.contentHash
    ),
  ]
);

// Source locator schema for validation
export const sourceLocatorSchema = z.object({
  url: z.string().url().optional(),
  page: z.number().int().positive().optional(),
  lineStart: z.number().int().nonnegative().optional(),
  lineEnd: z.number().int().nonnegative().optional(),
});

// Drizzle-zod schemas
export const insertInvestorSectionSchema = createInsertSchema(investorSections, {
  sectionType: z.enum(['thesis', 'criteria', 'portfolio', 'team', 'general']),
  sourceLocator: sourceLocatorSchema.optional(),
});

export const selectInvestorSectionSchema = createSelectSchema(investorSections);

// Inferred types
export type InvestorSection = typeof investorSections.$inferSelect;
export type NewInvestorSection = typeof investorSections.$inferInsert;
export type InsertInvestorSection = z.infer<typeof insertInvestorSectionSchema>;
export type SelectInvestorSection = z.infer<typeof selectInvestorSectionSchema>;
export type SourceLocator = z.infer<typeof sourceLocatorSchema>;
