'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, DocumentData, serverTimestamp } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2 } from 'lucide-react';


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

  const {
    data: transaction,
    isLoading,
    error,
  } = useDoc<Transaction>(transactionDocRef);

  const [enteredCode, setEnteredCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const isLender = user?.uid === transaction?.lenderId;
  const isBorrower = user?.uid === transaction?.borrowerId;

  const handleVerifyCode = () => {
    if (!transaction || !transactionDocRef || !isBorrower) return;

    setIsVerifying(true);
    if (enteredCode === transaction.handshakeCode) {
      setDocumentNonBlocking(
        transactionDocRef,
        {
          status: 'active',
          startTime: serverTimestamp(), // Set the official start time
        },
        { merge: true }
      );

      toast({
        title: 'Rental Started!',
        description: `You are now borrowing ${transaction.itemName}.`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Incorrect Code',
        description: 'The code you entered does not match. Please try again.',
      });
    }
    setIsVerifying(false);
  };
  
  const handleEndRental = () => {
    if (!transaction || !transactionDocRef || !isBorrower) return;
    
    // Generate a new code for the return handshake
    const endCode = Math.floor(100000 + Math.random() * 900000).toString();

    setDocumentNonBlocking(transactionDocRef, {
      status: 'pending-end',
      handshakeCode: endCode, // Overwrite with the new return code
    }, { merge: true });
    
     toast({
        title: 'Ready to Return',
        description: 'Show the new code to the lender to complete the return.',
      });
  }

  const handleConfirmReturn = () => {
    if (!transaction || !transactionDocRef || !isLender) return;

    setIsVerifying(true);
     if (enteredCode === transaction.handshakeCode) {
      setDocumentNonBlocking(transactionDocRef, {
          status: 'completed',
          actualEndTime: serverTimestamp(),
          handshakeCode: '', // Clear the code after use
      }, { merge: true });

      // Future: Award Karma points to both users here
      
      toast({
          title: 'Rental Completed!',
          description: `The item has been successfully returned.`,
      });
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

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!transaction) {
    return <div>Transaction not found.</div>;
  }

  const getStatusDescription = () => {
    switch (transaction.status) {
      case 'pending-handshake':
        return isLender
          ? 'Share the 6-digit code with the borrower to start the rental.'
          : 'Enter the 6-digit code from the lender to start the rental.';
      case 'active':
        return `Rental in progress. Enjoy the ${transaction.itemName}!`;
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

          {/* Lender's view: Display the code to start or end */}
          {isLender && (transaction.status === 'pending-handshake' || transaction.status === 'pending-end') && (
            <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg w-full">
              <p className="text-sm text-muted-foreground">Verification Code</p>
              <p className="text-4xl font-bold tracking-widest text-primary">
                {transaction.handshakeCode}
              </p>
            </div>
          )}

          {/* Borrower's view: Enter the code to start */}
          {isBorrower && transaction.status === 'pending-handshake' && (
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
              <Button onClick={handleVerifyCode} className="w-full" disabled={isVerifying || enteredCode.length !== 6}>
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Start Rental'}
              </Button>
            </div>
          )}
          
           {/* Lender's view: Enter return code to complete */}
          {isLender && transaction.status === 'pending-end' && (
            <div className="w-full space-y-4">
              <div className="flex items-center gap-2">
                <KeyRound className="text-muted-foreground" />
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="Enter return code"
                  value={enteredCode}
                  onChange={e => setEnteredCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  disabled={isVerifying}
                />
              </div>
              <Button onClick={handleConfirmReturn} className="w-full" disabled={isVerifying || enteredCode.length !== 6}>
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm Return'}
              </Button>
            </div>
          )}

          {/* Borrower's view: Show return code */}
          {isBorrower && transaction.status === 'pending-end' && (
             <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg w-full">
              <p className="text-sm text-muted-foreground">Return Code</p>
              <p className="text-4xl font-bold tracking-widest text-primary">
                {transaction.handshakeCode}
              </p>
            </div>
          )}

          {/* Active rental state */}
          {transaction.status === 'active' && (
            <div className="flex flex-col items-center gap-4 p-6 bg-green-50 border-green-200 border rounded-lg w-full">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium text-green-700">Rental is Active</p>
              {isBorrower && (
                  <Button onClick={handleEndRental} variant="outline">
                      End Rental & Generate Return Code
                  </Button>
              )}
            </div>
          )}

          {/* Completed rental state */}
          {transaction.status === 'completed' && (
            <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 border-gray-200 border rounded-lg w-full">
              <CheckCircle className="h-12 w-12 text-gray-500" />
              <p className="font-medium text-gray-700">Rental Completed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    