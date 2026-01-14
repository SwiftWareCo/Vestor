import 'server-only';
import { db } from '@/lib/db';
import { posts } from '@/lib/database';
import { eq } from 'drizzle-orm';

/**
 * Fetch all posts
 */
export async function getAllPosts() {
  return await db.select().from(posts);
}

/**
 * Fetch a post by ID
 */
export async function getPostById(postId: number) {
  const result = await db.select().from(posts).where(eq(posts.id, postId));
  return result[0];
}
