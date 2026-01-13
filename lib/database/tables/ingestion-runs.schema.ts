import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { investors } from './investors.schema';

// Ingestion run status enum
export const ingestionRunStatusEnum = pgEnum('ingestion_run_status', [
  'running',
  'succeeded',
  'failed',
  'canceled',
]);

/**
 * Step state schema for tracking workflow progress
 */
export const stepStateSchema = z.object({
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()).optional(),
  documentCounts: z
    .object({
      total: z.number(),
      processed: z.number(),
      failed: z.number(),
    })
    .optional(),
  lastUpdated: z.string().datetime().optional(),
});

export type StepState = z.infer<typeof stepStateSchema>;

/**
 * Ingestion Runs table
 *
 * Tracks the progress and status of investor ingestion workflows.
 * user_id references neon_auth.users_sync(id)
 */
export const ingestionRuns = pgTable(
  'ingestion_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    investorId: uuid('investor_id')
      .notNull()
      .references(() => investors.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    status: ingestionRunStatusEnum('status').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    stepState: jsonb('step_state').$type<StepState>(),
    error: text('error'),
  },
  (table) => [
    // Index for querying runs by investor
    index('ingestion_runs_investor_id_idx').on(table.investorId),
    // Index for querying runs by user
    index('ingestion_runs_user_id_idx').on(table.userId),
  ]
);

// Drizzle-zod schemas
export const insertIngestionRunSchema = createInsertSchema(ingestionRuns, {
  stepState: stepStateSchema.optional(),
});

export const selectIngestionRunSchema = createSelectSchema(ingestionRuns);

// Inferred types
export type IngestionRun = typeof ingestionRuns.$inferSelect;
export type NewIngestionRun = typeof ingestionRuns.$inferInsert;
export type InsertIngestionRun = z.infer<typeof insertIngestionRunSchema>;
export type SelectIngestionRun = z.infer<typeof selectIngestionRunSchema>;
