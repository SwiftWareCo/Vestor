import { neonAuth } from '@neondatabase/auth/next/server';
import { notFound } from 'next/navigation';
import { getInvestorByIdForUser, getInvestorDocuments } from '@/lib/data/investors';
import { getLatestIngestionRunForInvestor } from '@/lib/data/ingestion';
import { Badge } from '@/components/ui/badge';
import { AddUrlDocumentDialog } from '@/components/investors/add-url-document-dialog';
import { AddPdfDocumentDialog } from '@/components/investors/add-pdf-document-dialog';
import { StartIngestionButton } from '@/components/investors/start-ingestion-button';
import Link from 'next/link';
import { FileText, Globe, ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusVariants: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'
> = {
  draft: 'secondary',
  processing: 'default',
  needs_review: 'warning',
  ready: 'success',
  failed: 'destructive',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  processing: 'Processing',
  needs_review: 'Needs Review',
  ready: 'Ready',
  failed: 'Failed',
};

const docStatusVariants: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success'
> = {
  queued: 'secondary',
  processing: 'default',
  ready: 'success',
  failed: 'destructive',
};

const docStatusLabels: Record<string, string> = {
  queued: 'Queued',
  processing: 'Processing',
  ready: 'Ready',
  failed: 'Failed',
};

interface PageProps {
  params: Promise<{ investorId: string }>;
}

export default async function InvestorDetailPage({ params }: PageProps) {
  const { investorId } = await params;
  const { user } = await neonAuth();

  if (!user) {
    return <div>Please sign in to view this investor.</div>;
  }

  const investor = await getInvestorByIdForUser(user.id, investorId);

  if (!investor) {
    notFound();
  }

  const documents = await getInvestorDocuments(user.id, investorId);
  const latestRun = await getLatestIngestionRunForInvestor(user.id, investorId);

  const canStartIngestion =
    documents.length > 0 && investor.status !== 'processing';

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center gap-4">
        <Link href="/investors">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {investor.name || 'Unnamed Investor'}
            </h1>
            <Badge variant={statusVariants[investor.status] || 'outline'}>
              {statusLabels[investor.status] || investor.status}
            </Badge>
          </div>
          {investor.firm && (
            <p className="text-muted-foreground mt-1">{investor.firm}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Investor Details</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Name</span>
              <p>{investor.name || '—'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Firm</span>
              <p>{investor.firm || '—'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Website</span>
              {investor.website ? (
                <a
                  href={investor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-primary hover:underline"
                >
                  {investor.website}
                </a>
              ) : (
                <p>—</p>
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Coverage Score</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${investor.coverageScore}%` }}
                  />
                </div>
                <span className="text-sm">{investor.coverageScore}%</span>
              </div>
            </div>
          </div>
          <Link href={`/investors/${investorId}/review`}>
            <Button className="w-full" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Review Profile
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Ingestion Status</h2>
          {latestRun ? (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <p className="capitalize">{latestRun.status}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Started</span>
                <p>{new Date(latestRun.startedAt).toLocaleString()}</p>
              </div>
              {latestRun.finishedAt && (
                <div>
                  <span className="text-sm text-muted-foreground">Finished</span>
                  <p>{new Date(latestRun.finishedAt).toLocaleString()}</p>
                </div>
              )}
              {latestRun.error && (
                <div>
                  <span className="text-sm text-muted-foreground">Error</span>
                  <p className="text-destructive">{latestRun.error}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No ingestion runs yet.</p>
          )}
          <StartIngestionButton
            investorId={investorId}
            disabled={!canStartIngestion}
          />
        </div>
      </div>

      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Documents ({documents.length})
          </h2>
          <div className="flex gap-2">
            <AddUrlDocumentDialog investorId={investorId} />
            <AddPdfDocumentDialog investorId={investorId} />
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No documents yet. Add URLs or PDFs to start building the investor
              profile.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border p-4"
              >
                <div className="flex-shrink-0">
                  {doc.type === 'url' ? (
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {doc.type === 'url' ? doc.url : doc.storageKey}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {doc.type}
                  </p>
                </div>
                <Badge variant={docStatusVariants[doc.status] || 'outline'}>
                  {docStatusLabels[doc.status] || doc.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
