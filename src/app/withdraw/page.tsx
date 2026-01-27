'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee } from 'lucide-react';

type UserProfile = {
  karmaPoints: number;
};

const KARMA_TO_RUPEE_RATE = 25;
const PLATFORM_FEE_PERCENTAGE = 0.20; // 20%

export default function WithdrawPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'userProfiles', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  const karmaPoints = userProfile?.karmaPoints ?? 0;
  const rupeeValue = Math.floor(karmaPoints / KARMA_TO_RUPEE_RATE);
  const platformFee = rupeeValue * PLATFORM_FEE_PERCENTAGE;
  const finalWithdrawalAmount = rupeeValue - platformFee;
  const karmaToDeduct = rupeeValue * KARMA_TO_RUPEE_RATE;

  const handleWithdraw = async () => {
    if (!user || !firestore || !userProfileRef) return;
    if (karmaPoints < KARMA_TO_RUPEE_RATE) {
        toast({
            variant: 'destructive',
            title: 'Withdrawal Failed',
            description: `You need at least ${KARMA_TO_RUPEE_RATE} karma points to withdraw.`,
        });
        return;
    }

    setIsProcessing(true);
    try {
        await runTransaction(firestore, async (transaction) => {
            const freshProfileDoc = await transaction.get(userProfileRef);
            if (!freshProfileDoc.exists()) {
                throw new Error("User profile does not exist!");
            }
            const currentKarma = freshProfileDoc.data().karmaPoints;
            if (currentKarma < karmaToDeduct) {
                throw new Error("You do not have enough karma points to withdraw this amount.");
            }
            const newKarmaPoints = currentKarma - karmaToDeduct;
            transaction.update(userProfileRef, { karmaPoints: newKarmaPoints });
        });

        toast({
            title: 'Withdrawal Successful!',
            description: `A withdrawal request for ₹${finalWithdrawalAmount.toFixed(2)} has been processed. Your karma points have been updated.`,
        });

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Withdrawal Failed',
            description: error.message || 'An unexpected error occurred during the transaction.',
        });
    } finally {
        setIsProcessing(false);
    }
  };


  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start pt-10">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Withdraw Karma Points</CardTitle>
                <CardDescription>Convert your hard-earned karma into real rewards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-center p-6 bg-accent/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Your Current Balance</p>
                    <p className="text-4xl font-bold">{karmaPoints}</p>
                    <p className="text-sm text-muted-foreground">Karma Points</p>
                </div>
                <div className="space-y-4 text-center">
                    <p className="text-muted-foreground">Conversion Rate: {KARMA_TO_RUPEE_RATE} Karma = ₹1</p>
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-2xl font-bold">Total Withdrawable Amount:</p>
                        <p className="text-2xl font-bold flex items-center">
                            <IndianRupee className="h-6 w-6 mr-1" />
                            {rupeeValue.toFixed(2)}
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="w-full" disabled={rupeeValue <= 0 || isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Withdraw
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-2 mt-4">
                                     <div className="flex justify-between">
                                        <span>Withdrawable Amount:</span>
                                        <span className="font-semibold">₹{rupeeValue.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Platform Fee (20%):</span>
                                        <span className="font-semibold text-destructive">- ₹{platformFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                        <span>You will receive:</span>
                                        <span>₹{finalWithdrawalAmount.toFixed(2)}</span>
                                    </div>
                                     <p className="text-sm text-muted-foreground pt-4">
                                        This will deduct {karmaToDeduct} karma points from your balance. This action is irreversible.
                                     </p>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleWithdraw} disabled={isProcessing}>
                                {isProcessing ? 'Processing...' : 'Confirm & Withdraw'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    </div>
  );
}
