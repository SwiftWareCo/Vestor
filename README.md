# Vestor (Investor Matching Bot)

Vestor is a customer-facing SaaS that helps users match investors to clients/companies using AI-powered search + structured filters.

Users can upload their own investor lists first (private to their workspace), then optionally search a curated public investor database later. The app turns investor profiles (PDFs, websites, notes, emails, etc.) into searchable records and recommends the best-fit investors for a specific client based on sector, stage, geography, ticket size, thesis, and other constraints.

## What it does

- **Investor intake**: add investors manually or by uploading docs/links.
- **Document processing**: extract text, chunk, embed, and store for retrieval.
- **Investor search**: hybrid search (keywords + embeddings) with metadata filters.
- **AI matching**: rank and explain _why_ each investor is a fit (and why not).
- **Client profiles**: store client/company details and reuse them for matching.
- **Shortlists**: save, tag, and export recommended investors.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Neon
- **ORM**: Drizzle ORM
- **Authentication**: Neon Auth (built on Better Auth)
- **AI**: OpenAI embeddings and GPT for matching logic

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- Neon database account
- OpenAI API key (for embeddings and matching)

### 1. Clone and Install

```bash
git clone <repository-url>
cd vestor
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"

# Neon Auth
NEON_AUTH_BASE_URL="https://ep-xxx.neonauth.us-east-1.aws.neon.tech/neondb/auth"

# OpenAI (for embeddings and AI matching)
OPENAI_API_KEY="sk-..."

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### 3. Database Setup

```bash
# Generate database migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Open Drizzle Studio to manage database
pnpm db:studio
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
vestor/
├── app/                    # Next.js app router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── investors/         # Investor management
│   ├── clients/           # Client management
│   └── matching/          # AI matching interface
├── lib/
│   ├── auth/              # Auth client/server setup
│   ├── database/          # Database schemas and config
│   │   ├── tables/        # Individual table schemas
│   │   └── index.ts       # Schema exports
│   └── utils.ts           # Shared utilities
├── components/            # Reusable UI components
├── drizzle/              # Database migrations
└── proxy.ts              # Auth middleware
```

## Database Schema

The application uses Drizzle ORM with a modular schema structure:

- **users**: User accounts and authentication
- **investors**: Investor profiles and metadata
- **clients**: Client/company information
- **documents**: Uploaded investor documents
- **matches**: AI-generated investor-client matches
- **shortlists**: Saved investor recommendations

## Authentication

Uses Neon Auth for managed authentication:

- Email/password authentication
- Google OAuth integration
- Email OTP for passwordless login
- Session management handled automatically

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint:eslint  # Run ESLint
pnpm lint:types   # Run TypeScript checks
pnpm db:studio    # Open Drizzle Studio
pnpm db:push      # Push schema changes
```

### Adding New Features

1. Create schema in `lib/database/tables/feature.schema.ts`
2. Export in `lib/database/index.ts`
3. Run `pnpm db:push` to update database
4. Build UI components in `components/`
5. Add routes in `app/`

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
pnpm build
pnpm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
