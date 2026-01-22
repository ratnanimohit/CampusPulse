'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const feedbackSchema = z.object({
  comment: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  transactionId: string;
  ratedUserId: string;
  raterId: string;
}

export function FeedbackForm({ transactionId, ratedUserId, raterId }: FeedbackFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      comment: '',
    },
  });

  async function onSubmit(data: FeedbackFormValues) {
    if (rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Rating Required',
        description: 'Please select a star rating before submitting.',
      });
      return;
    }

    setIsSubmitting(true);

    const ratedUserRef = doc(firestore, 'userProfiles', ratedUserId);
    const raterRef = doc(firestore, 'userProfiles', raterId);
    const feedbackColRef = collection(firestore, 'feedback');
    const newFeedbackRef = doc(feedbackColRef);

    try {
      await runTransaction(firestore, async (transaction) => {
        const ratedUserDoc = await transaction.get(ratedUserRef);
        if (!ratedUserDoc.exists()) {
          throw new Error('Rated user profile not found!');
        }

        const currentData = ratedUserDoc.data();
        const oldRating = currentData.averageRating || 0;
        const oldRatingCount = currentData.ratingsCount || 0;

        const newRatingCount = oldRatingCount + 1;
        const newAverageRating = ((oldRating * oldRatingCount) + rating) / newRatingCount;

        // 1. Update the rated user's profile
        transaction.update(ratedUserRef, {
          averageRating: newAverageRating,
          ratingsCount: newRatingCount,
        });

        // 2. Give the rater karma points for providing feedback
        transaction.update(raterRef, {
          karmaPoints: increment(5),
        });

        // 3. Create the feedback document
        transaction.set(newFeedbackRef, {
          id: newFeedbackRef.id,
          transactionId,
          raterId,
          ratedUserId,
          rating,
          comment: data.comment,
          createdAt: serverTimestamp(),
        });
      });

      toast({
        title: 'Feedback Submitted!',
        description: "You've earned 5 karma points. Thank you!",
      });
      setFeedbackSubmitted(true);

    } catch (error: any) {
      console.error('Feedback transaction failed: ', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Could not submit your feedback.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (feedbackSubmitted) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-center font-semibold">Rate Your Experience</h3>
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1"
          >
            <Star
              className={cn(
                'h-8 w-8 transition-colors',
                (hoverRating || rating) >= star
                  ? 'text-primary fill-primary'
                  : 'text-muted-foreground/30'
              )}
            />
          </button>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Optional Comment</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us more about the transaction..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Feedback
          </Button>
        </form>
      </Form>
    </div>
  );
}
