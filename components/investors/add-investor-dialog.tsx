'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createInvestorAction } from '@/lib/actions/investors.actions';
import { createInvestorSchema, type CreateInvestorInput } from '@/lib/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

export function AddInvestorDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<CreateInvestorInput>({
    resolver: zodResolver(createInvestorSchema),
    defaultValues: {
      name: '',
      firm: '',
      website: '',
    },
  });

  async function onSubmit(data: CreateInvestorInput) {
    try {
      const investor = await createInvestorAction({
        name: data.name || undefined,
        firm: data.firm || undefined,
        website: data.website || undefined,
      });
      toast.success('Investor created successfully!');
      form.reset();
      setOpen(false);
      router.push(`/investors/${investor.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create investor');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Investor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Investor</DialogTitle>
          <DialogDescription>
            Create a new investor profile. You can add documents and start ingestion after.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Smith" {...field} />
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
                    <Input placeholder="e.g. Acme Ventures" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="e.g. https://acmeventures.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Investor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
