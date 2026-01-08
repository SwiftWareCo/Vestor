'use server';

import { db } from '@/lib/db';
import { posts } from '@/lib/database';
import { neonAuth } from '@neondatabase/auth/next/server';
import { revalidatePath } from 'next/cache';

export async function createPost(title: string, content?: string) {
  const { user } = await neonAuth();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!title.trim()) {
    throw new Error('Post title is required');
  }

  const [newPost] = await db
    .insert(posts)
    .values({
      title: title.trim(),
      content: content?.trim() || null,
      authorId: user.id,
    })
    .returning();

  revalidatePath('/');
  return newPost;
}
