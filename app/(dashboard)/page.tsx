import { neonAuth } from '@neondatabase/auth/next/server';
import { db } from '@/lib/db';
import { posts } from '@/lib/database';
import { CreatePostDialog } from '@/components/posts/CreatePostDialog';

export default async function DashboardPage() {
  const { session, user } = await neonAuth();
  
  // Fetch all posts
  const allPosts = await db.select().from(posts);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <p className='text-muted-foreground mt-2'>
          Welcome back{user?.name ? `, ${user.name}` : ''}!
        </p>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-semibold'>Posts</h2>
          <div className='flex items-center gap-4'>
            <span className='text-sm text-muted-foreground'>
              {allPosts.length} {allPosts.length === 1 ? 'post' : 'posts'}
            </span>
            <CreatePostDialog />
          </div>
        </div>

        {allPosts.length === 0 ? (
          <div className='rounded-lg border border-dashed p-8 text-center'>
            <p className='text-muted-foreground'>No posts yet. Create your first post to get started!</p>
          </div>
        ) : (
          <div className='grid gap-4'>
            {allPosts.map((post) => (
              <div
                key={post.id}
                className='rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md'
              >
                <div className='space-y-2'>
                  <h3 className='text-xl font-semibold'>{post.title}</h3>
                  {post.content && (
                    <p className='text-muted-foreground line-clamp-3'>{post.content}</p>
                  )}
                  <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                    {post.createdAt && (
                      <span>
                        Created: {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    )}
                    {post.authorId && (
                      <span>Author ID: {post.authorId}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
