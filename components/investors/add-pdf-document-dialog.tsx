'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { addInvestorPdfDocumentAction } from '@/lib/actions/investors.actions';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FileText } from 'lucide-react';

const addPdfFormSchema = z.object({
  storageKey: z.string().min(1, 'Storage key is required'),
});

type AddPdfFormInput = z.infer<typeof addPdfFormSchema>;

interface AddPdfDocumentDialogProps {
  investorId: string;
}

export function AddPdfDocumentDialog({ investorId }: AddPdfDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<AddPdfFormInput>({
    resolver: zodResolver(addPdfFormSchema),
    defaultValues: {
      storageKey: '',
    },
  });

  async function onSubmit(data: AddPdfFormInput) {
    try {
      await addInvestorPdfDocumentAction({
        investorId,
        storageKey: data.storageKey,
      });
      toast.success('PDF added successfully!');
      form.reset();
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add PDF');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Add PDF
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add PDF Document</DialogTitle>
          <DialogDescription>
            Add a PDF document to extract investor information from.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="storageKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="uploads/investor-deck.pdf"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the storage key for the uploaded PDF file.
                  </FormDescription>
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
                {form.formState.isSubmitting ? 'Adding...' : 'Add PDF'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
