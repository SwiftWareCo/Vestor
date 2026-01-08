import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

/**
 * Posts table
 * 
 * authorId references neon_auth.users_sync(id)
 * The foreign key constraint should be added via migration:
 * ALTER TABLE posts ADD CONSTRAINT posts_author_id_fkey 
 * FOREIGN KEY (author_id) REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE;
 */
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: text('author_id').notNull(), // References neon_auth.users_sync(id)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

// Form schema for creating posts (excludes id, authorId, timestamps)
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
