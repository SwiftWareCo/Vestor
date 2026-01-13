import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { investors } from './investors.schema';

// Document type enum
export const documentTypeEnum = pgEnum('document_type', ['url', 'pdf', 'pasted']);

// Document status enum
export const documentStatusEnum = pgEnum('document_status', [
  'queued',
  'processing',
  'ready',
  'failed',
]);

/**
 * Documents table
 *
 * Stores source documents (URLs, PDFs, pasted text) for investor ingestion.
 * user_id references neon_auth.users_sync(id)
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    investorId: uuid('investor_id')
      .notNull()
      .references(() => investors.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    type: documentTypeEnum('type').notNull(),
    url: text('url'),
    storageKey: text('storage_key'),
    contentHash: text('content_hash').notNull(),
    status: documentStatusEnum('status').default('queued').notNull(),
    extractedText: text('extracted_text'),
    metaJson: jsonb('meta_json').$type<Record<string, unknown>>(),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Unique constraint to prevent duplicate documents per user
    uniqueIndex('documents_user_content_hash_idx').on(table.userId, table.contentHash),
  ]
);

// Drizzle-zod schemas
export const insertDocumentSchema = createInsertSchema(documents, {
  url: z.string().url().optional(),
  storageKey: z.string().optional(),
  metaJson: z.record(z.string(), z.unknown()).optional(),
});

export const selectDocumentSchema = createSelectSchema(documents);

// Inferred types
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type SelectDocument = z.infer<typeof selectDocumentSchema>;

// Form schema for adding URL document
export const addUrlDocumentSchema = z.object({
  investorId: z.string().uuid(),
  url: z.string().url('Please enter a valid URL'),
});

export type AddUrlDocumentInput = z.infer<typeof addUrlDocumentSchema>;

// Form schema for adding PDF document
export const addPdfDocumentSchema = z.object({
  investorId: z.string().uuid(),
  storageKey: z.string().min(1, 'Storage key is required'),
});

export type AddPdfDocumentInput = z.infer<typeof addPdfDocumentSchema>;
