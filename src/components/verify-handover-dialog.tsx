'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { simpleHash } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const verificationSchema = z.object({
  code: z.string().length(4, 'Code must be 4 digits.'),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

interface VerifyHandoverDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    id: string;
    itemId: string;
    handoverCodeHash: string;
  };
}

export function VerifyHandoverDialog({ isOpen, onOpenChange, transaction }: VerifyHandoverDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmit = async (data: VerificationFormValues) => {
    if (simpleHash(data.code) !== transaction.handoverCodeHash) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'The handover code is incorrect. Please try again.',
      });
      form.setValue('code', '');
      return;
    }

    setIsProcessing(true);
    try {
      const transactionDocRef = doc(firestore, 'transactions', transaction.id);
      await updateDoc(transactionDocRef, {
        handoverVerified: true,
        status: 'ACTIVE',
        updatedAt: serverTimestamp(),
      });
      
      // FIX: The original item request is NOT deleted here.
      // It is now deleted only when the transaction is 'COMPLETED'.
      // This ensures it remains visible on the 'My Requests' page while active.

      toast({
        title: 'Handover Verified!',
        description: 'The transaction is now active.',
      });
      onOpenChange(false);
      form.reset();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Handover</DialogTitle>
          <DialogDescription>
            Enter the 4-digit code provided by the lender to confirm you have received the item.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={4}
                      placeholder="••••"
                      className="text-center text-2xl tracking-[1rem]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Activate
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
