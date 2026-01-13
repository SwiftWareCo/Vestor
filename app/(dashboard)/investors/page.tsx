import { neonAuth } from '@neondatabase/auth/next/server';
import { getInvestorsForUser } from '@/lib/data/investors';
import { AddInvestorDialog } from '@/components/investors/add-investor-dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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

export default async function InvestorsPage() {
  const { user } = await neonAuth();

  if (!user) {
    return <div>Please sign in to view investors.</div>;
  }

  const investors = await getInvestorsForUser(user.id);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investors</h1>
          <p className="text-muted-foreground mt-2">
            Manage your investor profiles and ingestion pipeline
          </p>
        </div>
        <AddInvestorDialog />
      </div>

      {investors.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No investors yet. Add your first investor to get started!
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-medium">Name</th>
                <th className="p-4 text-left font-medium">Firm</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Coverage</th>
                <th className="p-4 text-left font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((investor) => (
                <tr
                  key={investor.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4">
                    <Link
                      href={`/investors/${investor.id}`}
                      className="font-medium hover:underline"
                    >
                      {investor.name || 'Unnamed Investor'}
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {investor.firm || '—'}
                  </td>
                  <td className="p-4">
                    <Badge variant={statusVariants[investor.status] || 'outline'}>
                      {statusLabels[investor.status] || investor.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${investor.coverageScore}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {investor.coverageScore}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(investor.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
