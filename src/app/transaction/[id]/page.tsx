'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, serverTimestamp, updateDoc, collection, addDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, ArrowLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

type Transaction = {
  id: string;
  lenderId: string;
  borrowerId: string;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  karma: number;
  status: 'pending-handshake' | 'active' | 'pending-end' | 'completed';
  handshakeCode?: string;
  startTime?: any;
  actualEndTime?: any;
};

export default function TransactionPage() {
  const { id: transactionId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const transactionDocRef = useMemoFirebase(
    () =>
      firestore && transactionId
        ? doc(firestore, 'transactions', transactionId as string)
        : null,
    [firestore, transactionId]
  );

  const { data: transaction, isLoading } = useDoc<Transaction>(transactionDocRef);

  const [enteredCode, setEnteredCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const isLender = user?.uid === transaction?.lenderId;
  const isBorrower = user?.uid === transaction?.borrowerId;

  const handleVerifyCode = async () => {
    if (!transaction || !transactionDocRef || !isBorrower) return;

    setIsVerifying(true);
    if (enteredCode === transaction.handshakeCode) {
      try {
        await updateDoc(transactionDocRef, {
            status: 'active',
            startTime: serverTimestamp(),
            handshakeCode: '', // Clear the code after use
        });

        toast({
            title: 'Rental Started!',
            description: `You are now borrowing ${transaction.itemName}.`,
        });
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not start the rental. Please try again.',
        });
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'Incorrect Code',
        description: 'The code you entered does not match. Please try again.',
      });
    }
    setIsVerifying(false);
  };
  
  const handleEndRental = async () => {
    if (!transaction || !transactionDocRef || !isBorrower) return;
    
    const endCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        await updateDoc(transactionDocRef, {
            status: 'pending-end',
            handshakeCode: endCode,
        });
        
         toast({
            title: 'Ready to Return',
            description: 'Show the new code to the lender to complete the return.',
          });
    } catch(error) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not initiate the return process.',
          });
    }
  }

  const handleConfirmReturn = async () => {
    if (!transaction || !transactionDocRef || !isLender) return;

    setIsVerifying(true);
     if (enteredCode === transaction.handshakeCode) {
        try {
            await updateDoc(transactionDocRef, {
                status: 'completed',
                actualEndTime: serverTimestamp(),
                handshakeCode: '',
            });
            
            toast({
                title: 'Rental Completed!',
                description: `The item has been successfully returned.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not complete the return. Please try again.',
            });
        }
    } else {
       toast({
        variant: 'destructive',
        title: 'Incorrect Code',
        description: 'The return code is incorrect.',
      });
    }
    setIsVerifying(false);
  }


  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!transaction) {
    return (
        <div className="flex flex-col gap-4 items-center text-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Transaction Not Found</CardTitle>
                    <CardDescription>This transaction may have been cancelled or does not exist.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  const getStatusDescription = () => {
    switch (transaction.status) {
      case 'pending-handshake':
        return isLender
          ? 'Share the 6-digit code with the borrower to start the rental.'
          : 'Enter the 6-digit code from the lender to start the rental.';
      case 'active':
        return `Rental in progress for ${transaction.itemName}.`;
      case 'pending-end':
        return isBorrower
          ? 'Share the new 6-digit code with the lender to complete the return.'
          : 'Enter the code from the borrower to confirm the return.';
      case 'completed':
        return 'This transaction has been completed.';
      default:
        return 'Transaction status is unknown.';
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-start items-center mb-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft />
              </Link>
            </Button>
          </div>
          <CardTitle className="font-headline text-2xl">
            Transaction Details
          </CardTitle>
          <CardDescription>{getStatusDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="relative w-48 h-48">
            <Image
              src={transaction.itemImageUrl}
              alt={transaction.itemName}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
              data-ai-hint="item"
            />
          </div>
          <h2 className="text-xl font-semibold">{transaction.itemName}</h2>

          <div className="w-full space-y-4">
             {/* LENDER'S VIEW */}
            {isLender && (
                <>
                    {transaction.status === 'pending-handshake' && (
                         <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg w-full">
                            <p className="text-sm text-muted-foreground">Verification Code</p>
                            <p className="text-4xl font-bold tracking-widest text-primary">
                            {transaction.handshakeCode}
                            </p>
                        </div>
                    )}
                    {transaction.status === 'pending-end' && (
                        <div className="w-full space-y-4">
                            <div className="flex items-center gap-2">
                            <KeyRound className="text-muted-foreground" />
                            <Input
                                type="text"
                                maxLength={6}
                                placeholder="Enter 6-digit code"
                                value={enteredCode}
                                onChange={e => setEnteredCode(e.target.value)}
                                className="text-center text-lg tracking-widest"
                                disabled={isVerifying}
                            />
                            </div>
                            <Button 
                            onClick={handleConfirmReturn} 
                            className="w-full" 
                            disabled={isVerifying || enteredCode.length !== 6}
                            >
                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Return
                            </Button>
                        </div>
                    )}
                    {transaction.status === 'active' && (
                        <p className="text-muted-foreground text-center">Waiting for the borrower to end the rental.</p>
                    )}
                </>
            )}

            {/* BORROWER'S VIEW */}
            {isBorrower && (
                 <>
                    {transaction.status === 'pending-handshake' && (
                        <div className="w-full space-y-4">
                            <div className="flex items-center gap-2">
                                <KeyRound className="text-muted-foreground" />
                                <Input
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter 6-digit code"
                                    value={enteredCode}
                                    onChange={e => setEnteredCode(e.target.value)}
                                    className="text-center text-lg tracking-widest"
                                    disabled={isVerifying}
                                />
                            </div>
                            <Button 
                                onClick={handleVerifyCode} 
                                className="w-full" 
                                disabled={isVerifying || enteredCode.length !== 6}
                            >
                                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Start Rental
                            </Button>
                        </div>
                    )}
                    {transaction.status === 'active' && (
                         <Button onClick={handleEndRental} variant="outline" className="w-full">
                            End Rental & Generate Return Code
                        </Button>
                    )}
                    {transaction.status === 'pending-end' && (
                         <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg w-full">
                            <p className="text-sm text-muted-foreground">Return Code</p>
                            <p className="text-4xl font-bold tracking-widest text-primary">
                            {transaction.handshakeCode}
                            </p>
                        </div>
                    )}
                 </>
            )}
            
            {transaction.status === 'completed' && (
                <div className="text-center space-y-4">
                     <p className="text-muted-foreground text-center">This transaction is complete.</p>
                     <Button asChild variant="outline" className="mt-4">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
