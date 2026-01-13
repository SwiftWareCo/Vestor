'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { startInvestorIngestionAction } from '@/lib/actions/ingestion.actions';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';

interface StartIngestionButtonProps {
  investorId: string;
  disabled?: boolean;
}

export function StartIngestionButton({
  investorId,
  disabled,
}: StartIngestionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setIsLoading(true);
    try {
      const { runId } = await startInvestorIngestionAction({ investorId });
      toast.success('Ingestion started!', {
        description: `Run ID: ${runId.slice(0, 8)}...`,
      });
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to start ingestion'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Starting...
        </>
      ) : (
        <>
          <Play className="mr-2 h-4 w-4" />
          Start Ingestion
        </>
      )}
    </Button>
  );
}
