'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { addInvestorUrlDocumentAction } from '@/lib/actions/investors.actions';
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
import { Globe } from 'lucide-react';

const addUrlFormSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

type AddUrlFormInput = z.infer<typeof addUrlFormSchema>;

interface AddUrlDocumentDialogProps {
  investorId: string;
}

export function AddUrlDocumentDialog({ investorId }: AddUrlDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<AddUrlFormInput>({
    resolver: zodResolver(addUrlFormSchema),
    defaultValues: {
      url: '',
    },
  });

  async function onSubmit(data: AddUrlFormInput) {
    try {
      await addInvestorUrlDocumentAction({
        investorId,
        url: data.url,
      });
      toast.success('URL added successfully!');
      form.reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add URL');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Globe className="mr-2 h-4 w-4" />
          Add URL
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add URL Document</DialogTitle>
          <DialogDescription>
            Add a website URL to extract investor information from.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/investor-profile"
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
                {form.formState.isSubmitting ? 'Adding...' : 'Add URL'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
