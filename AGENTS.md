# AGENTS.md - Vestor Project Guidelines

This document provides comprehensive guidelines for agentic coding tools working in the Vestor codebase. Follow these rules to maintain consistency with the existing architecture and patterns.

## Build, Lint, and Test Commands

### Development & Build
```bash
pnpm dev          # Start development server (Next.js 16)
pnpm build        # Build for production
pnpm start        # Start production server
```

### Code Quality
```bash
pnpm run lint:types   # Run TypeScript type checking
pnpm run lint:eslint  # Run ESLint linting
```

### Database
```bash
pnpm db:push      # Push schema changes to Neon PostgreSQL
pnpm db:studio    # Open Drizzle Studio for database management
```

### Testing
**Note:** No testing framework is currently configured. When adding tests:
- Use a framework like Vitest or Jest
- Add test scripts to package.json
- Run tests with a dedicated command

## Code Style Guidelines

### UI Components & Styling
- **Always use shadcn/ui components** for UI elements
- **Always use Tailwind CSS** for styling
- Use the "new-york" style variant from shadcn/ui
- Import components from `@/components/ui/*`
- Use Lucide React for icons
- Apply `cn()` utility from `@/lib/utils` for conditional classes

### Forms
- **Always use react-hook-form** for form handling
- Use the Form component from `@/components/ui/form`
- **Use drizzle-zod schemas** from schema files for form validation
- Import `zodResolver` from `@hookform/resolvers`
- Define form schemas in schema files using `createInsertSchema` from drizzle-zod
- Example:
```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers"
import { Form } from "@/components/ui/form"
import { createPostSchema } from "@/lib/database/tables/posts.schema"
```

### Types & Type Safety
- **Schema files are the source of truth** for typing using drizzle-zod
- Use Drizzle's `$inferSelect` and `$inferInsert` for database types
- Define form validation schemas in table schema files
- Enable strict TypeScript mode (already configured)
- Use explicit return types for functions

### Data Access Patterns
- **Always use data files** in `lib/data/` for data access
- **Always use `server-only`** for data access files
- Import database connection from `@/lib/db`
- Use Drizzle ORM query methods
- Example structure:
```typescript
import 'server-only'
import { db } from '@/lib/db'
import { posts } from '@/lib/database'
```

### Mutations & Server Actions
- **Always use actions files** in `lib/actions/` for mutations
- **Always use `'use server'` directive** at the top of action files
- Import database and auth utilities
- Handle authentication and validation in actions
- Use `revalidatePath()` for cache invalidation
- Example structure:
```typescript
'use server'

import { db } from '@/lib/db'
import { neonAuth } from '@neondatabase/auth/next/server'
import { revalidatePath } from 'next/cache'
```

### Authentication
- **Server Components**: Import `authServer` from `@/lib/auth/server.ts` or use `neonAuth()` utility
- **Client Components**: Import `authClient` from `@/lib/auth/client.ts`
- Use Neon Auth (built on Better Auth) for all authentication needs
- Access user data with `{ user } = await neonAuth()`

### Import Organization
- Use `@/` path aliases consistently
- Group imports by external libraries first, then internal imports
- Separate React imports on their own line
- Example:
```typescript
import * as React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { posts } from "@/lib/database"
```

### Error Handling
- Throw descriptive `Error` objects for validation failures
- Use meaningful error messages that can be displayed to users
- Handle authentication errors appropriately
- Example:
```typescript
if (!user) {
  throw new Error('Unauthorized')
}

if (!title.trim()) {
  throw new Error('Post title is required')
}
```

### Naming Conventions
- **Variables/Functions**: camelCase (`getUserPosts`, `isValidEmail`)
- **Components**: PascalCase (`UserProfile`, `CreatePostDialog`)
- **Types/Interfaces**: PascalCase (`Post`, `CreatePostInput`)
- **Files**: kebab-case for components (`user-button.tsx`), camelCase for utilities (`authClient.ts`)
- **Database Tables**: snake_case (handled by Drizzle)
- **Directories**: camelCase (`lib/auth`, `components/ui`)

### File Organization
- `app/`: Next.js app router pages and layouts
- `lib/auth/`: Authentication client and server setup
- `lib/database/`: Database schemas and configuration
- `lib/data/`: Data access functions (server-only)
- `lib/actions/`: Server actions for mutations
- `components/ui/`: shadcn/ui components
- `components/`: Application-specific components

### Component Patterns
- Use functional components with hooks
- Prefer server components when possible, client components when needed
- Use proper TypeScript props interfaces
- Follow React 19 patterns
- Example component structure:
```typescript
interface UserButtonProps {
  user: User
}

export function UserButton({ user }: UserButtonProps) {
  return (
    <Button variant="outline">
      {user.name}
    </Button>
  )
}
```

### Database Schema Patterns
- Define tables in `lib/database/tables/*.schema.ts`
- Use Drizzle's `pgTable` with appropriate column types
- Include JSDoc comments for table descriptions
- Export inferred types and form schemas
- Example:
```typescript
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  // ...
})

export type Post = typeof posts.$inferSelect
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})
```

### Environment Variables
- Use `.env.local` for local development
- Required variables: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `OPENAI_API_KEY`
- Access via `process.env.VARIABLE_NAME`

### Post-Change Verification
After making changes:
1. Run `pnpm run lint:types` to verify TypeScript compliance
2. Run `pnpm run lint:eslint` to check code style
3. Test functionality in development server (`pnpm dev`)
4. Verify database changes with `pnpm db:push` if schema modified

### Commit Guidelines
- Write descriptive commit messages
- Run linting before committing
- Test changes thoroughly before pushing
- Use conventional commit format when possible

This document should be updated when new patterns or tools are introduced to the codebase.</content>
<parameter name="filePath">/home/braille/projects/vestor/AGENTS.md