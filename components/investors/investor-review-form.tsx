'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  updateInvestorProfileSchema,
  type UpdateInvestorProfileInput,
  type Investor,
} from '@/lib/database';
import { updateInvestorProfileAction } from '@/lib/actions/investors.actions';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface InvestorReviewFormProps {
  investor: Investor;
}

export function InvestorReviewForm({ investor }: InvestorReviewFormProps) {
  const router = useRouter();

  const form = useForm<UpdateInvestorProfileInput>({
    resolver: zodResolver(updateInvestorProfileSchema),
    defaultValues: {
      name: investor.name || '',
      firm: investor.firm || '',
      website: investor.website || '',
      thesisSummary: investor.thesisSummary || '',
      checkSizeMin: investor.checkSizeMin,
      checkSizeMax: investor.checkSizeMax,
      stages: investor.stages || [],
      geographies: investor.geographies || [],
      focusSectors: investor.focusSectors || [],
      excludedSectors: investor.excludedSectors || [],
      reviewNotes: investor.reviewNotes || '',
    },
  });

  async function onSubmit(data: UpdateInvestorProfileInput) {
    try {
      await updateInvestorProfileAction(investor.id, data);
      toast.success('Profile updated successfully!');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="firm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firm</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input type="url" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thesisSummary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thesis Summary</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="checkSizeMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check Size Min ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="checkSizeMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Check Size Max ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="stages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stages (comma-separated)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value?.join(', ') || ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="geographies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Geographies (comma-separated)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value?.join(', ') || ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="focusSectors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Focus Sectors (comma-separated)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value?.join(', ') || ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="excludedSectors"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excluded Sectors (comma-separated)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value?.join(', ') || ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reviewNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Review Notes</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}
