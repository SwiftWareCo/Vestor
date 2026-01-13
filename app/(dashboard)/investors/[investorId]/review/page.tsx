import { neonAuth } from '@neondatabase/auth/next/server';
import { notFound } from 'next/navigation';
import { getInvestorByIdForUser, getInvestorSections } from '@/lib/data/investors';
import { Badge } from '@/components/ui/badge';
import { InvestorReviewForm } from '@/components/investors/investor-review-form';
import { EvidenceViewer } from '@/components/investors/evidence-viewer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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

interface PageProps {
  params: Promise<{ investorId: string }>;
}

export default async function InvestorReviewPage({ params }: PageProps) {
  const { investorId } = await params;
  const { user } = await neonAuth();

  if (!user) {
    return <div>Please sign in to view this page.</div>;
  }

  const investor = await getInvestorByIdForUser(user.id, investorId);

  if (!investor) {
    notFound();
  }

  const sections = await getInvestorSections(user.id, investorId);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center gap-4">
        <Link href={`/investors/${investorId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Review: {investor.name || 'Unnamed Investor'}</h1>
            <Badge variant={statusVariants[investor.status] || 'outline'}>
              {statusLabels[investor.status] || investor.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Coverage: {investor.coverageScore}%
            {investor.missingFields && investor.missingFields.length > 0 && (
              <span className="ml-2">
                (Missing: {investor.missingFields.join(', ')})
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Edit Profile</h2>
          <InvestorReviewForm investor={investor} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Evidence ({sections.length} chunks)</h2>
          <EvidenceViewer sections={sections} />
        </div>
      </div>
    </div>
  );
}
