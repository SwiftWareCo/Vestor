import { db } from '@/lib/db';
import { posts } from '@/lib/database';

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
  const allPosts = await db.select().from(posts);
  return allPosts.find((post) => post.id === postId);
}
