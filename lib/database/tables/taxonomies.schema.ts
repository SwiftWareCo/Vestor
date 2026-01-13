import { pgTable, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Stage Taxonomy table
 *
 * Stores canonical investment stage names with their aliases.
 * Examples: 'Pre-Seed', 'Seed', 'Series A', 'Series B', etc.
 */
export const stageTaxonomy = pgTable('stage_taxonomy', {
  canonical: text('canonical').primaryKey(),
  aliases: text('aliases').array().notNull().default([]),
});

// Drizzle-zod schemas for stage taxonomy
export const insertStageTaxonomySchema = createInsertSchema(stageTaxonomy, {
  canonical: z.string().min(1),
  aliases: z.array(z.string()).default([]),
});

export const selectStageTaxonomySchema = createSelectSchema(stageTaxonomy);

// Inferred types for stage taxonomy
export type StageTaxonomy = typeof stageTaxonomy.$inferSelect;
export type NewStageTaxonomy = typeof stageTaxonomy.$inferInsert;

/**
 * Sector Taxonomy table
 *
 * Stores canonical sector names with their aliases.
 * Examples: 'FinTech', 'HealthTech', 'SaaS', 'AI/ML', etc.
 */
export const sectorTaxonomy = pgTable('sector_taxonomy', {
  canonical: text('canonical').primaryKey(),
  aliases: text('aliases').array().notNull().default([]),
});

// Drizzle-zod schemas for sector taxonomy
export const insertSectorTaxonomySchema = createInsertSchema(sectorTaxonomy, {
  canonical: z.string().min(1),
  aliases: z.array(z.string()).default([]),
});

export const selectSectorTaxonomySchema = createSelectSchema(sectorTaxonomy);

// Inferred types for sector taxonomy
export type SectorTaxonomy = typeof sectorTaxonomy.$inferSelect;
export type NewSectorTaxonomy = typeof sectorTaxonomy.$inferInsert;

/**
 * Default stage taxonomy entries
 * Use these when seeding the database
 */
export const defaultStages: NewStageTaxonomy[] = [
  { canonical: 'Pre-Seed', aliases: ['pre seed', 'preseed', 'pre-seed'] },
  { canonical: 'Seed', aliases: ['seed', 'seed stage'] },
  { canonical: 'Series A', aliases: ['series a', 'a round', 'a-round'] },
  { canonical: 'Series B', aliases: ['series b', 'b round', 'b-round'] },
  { canonical: 'Series C', aliases: ['series c', 'c round', 'c-round'] },
  { canonical: 'Series D+', aliases: ['series d', 'series e', 'series f', 'growth', 'late stage'] },
];

/**
 * Default sector taxonomy entries
 * Use these when seeding the database
 */
export const defaultSectors: NewSectorTaxonomy[] = [
  { canonical: 'AI/ML', aliases: ['artificial intelligence', 'machine learning', 'ai', 'ml'] },
  { canonical: 'FinTech', aliases: ['fintech', 'financial technology', 'finance'] },
  { canonical: 'HealthTech', aliases: ['healthtech', 'health tech', 'healthcare', 'digital health'] },
  { canonical: 'SaaS', aliases: ['saas', 'software as a service', 'b2b saas'] },
  { canonical: 'E-commerce', aliases: ['ecommerce', 'e-commerce', 'retail tech'] },
  { canonical: 'EdTech', aliases: ['edtech', 'education technology', 'education'] },
  { canonical: 'CleanTech', aliases: ['cleantech', 'clean tech', 'climate tech', 'sustainability'] },
  { canonical: 'Cybersecurity', aliases: ['cybersecurity', 'security', 'infosec'] },
  { canonical: 'DeepTech', aliases: ['deeptech', 'deep tech', 'frontier tech'] },
  { canonical: 'Consumer', aliases: ['consumer', 'b2c', 'consumer tech'] },
  { canonical: 'Enterprise', aliases: ['enterprise', 'b2b', 'enterprise software'] },
  { canonical: 'Marketplace', aliases: ['marketplace', 'marketplaces', 'platform'] },
];
