'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
  originalRequestId?: string;
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
  const [isEnding, setIsEnding] = useState(false);

  const isLender = user?.uid === transaction?.lenderId;
  const isBorrower = user?.uid === transaction?.borrowerId;

  const handleVerifyStartCode = async () => {
    if (!transaction || !transactionDocRef || !isBorrower || !firestore) return;

    setIsVerifying(true);
    if (enteredCode === transaction.handshakeCode) {
      try {
        await updateDoc(transactionDocRef, {
            status: 'active',
            startTime: serverTimestamp(),
            handshakeCode: '', // Clear the code after use
        });

        // After verification, delete the original request
        if (transaction.originalRequestId) {
          const requestDocRef = doc(firestore, 'itemRequests', transaction.originalRequestId);
          deleteDocumentNonBlocking(requestDocRef);
        }

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
    setEnteredCode('');
    setIsVerifying(false);
  };
  
  const handleEndRental = async () => {
    if (!transaction || !transactionDocRef || !isBorrower) return;
    setIsEnding(true);
    
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
    } finally {
        setIsEnding(false);
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
    setEnteredCode('');
    setIsVerifying(false);
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  if (!transaction) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center mt-10">
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
  
  if (!isLender && !isBorrower) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center mt-10">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Unauthorized</CardTitle>
                    <CardDescription>You are not a participant in this transaction.</CardDescription>
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

  return (
    <div className="flex flex-col gap-4 items-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-start items-center mb-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft />
              </Link>
            </Button>
          </div>
          <CardTitle className="font-headline text-2xl">
            Transaction Handshake
          </CardTitle>
           <CardDescription>
            For {transaction.itemName}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
            <div className="relative w-48 h-48">
              <Image src={transaction.itemImageUrl} alt={transaction.itemName} layout="fill" objectFit="cover" className="rounded-lg" data-ai-hint="item"/>
            </div>

            {/* PENDING HANDSHAKE */}
            {transaction.status === 'pending-handshake' && (
                <>
                {isLender && (
                    <div className="w-full text-center">
                        <p className="text-muted-foreground mb-4">Share the 6-digit code below with the borrower to start the rental.</p>
                        <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg w-full">
                            <p className="text-sm text-muted-foreground">Verification Code</p>
                            <p className="text-4xl font-bold tracking-widest text-primary">{transaction.handshakeCode}</p>
                        </div>
                    </div>
                )}
                {isBorrower && (
                    <div className="w-full space-y-4">
                        <p className="text-muted-foreground text-center">Enter the 6-digit code from the lender to start the rental.</p>
                        <div className="flex items-center gap-2">
                            <KeyRound className="text-muted-foreground" />
                            <Input type="text" maxLength={6} placeholder="Enter 6-digit code" value={enteredCode} onChange={e => setEnteredCode(e.target.value)} className="text-center text-lg tracking-widest" disabled={isVerifying} />
                        </div>
                        <Button onClick={handleVerifyStartCode} className="w-full" disabled={isVerifying || enteredCode.length !== 6}>
                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Start Rental
                        </Button>
                    </div>
                )}
                </>
            )}

            {/* ACTIVE RENTAL */}
            {transaction.status === 'active' && (
                <>
                {isLender && (
                    <div className="text-center">
                        <h3 className="font-semibold text-lg">Rental in Progress</h3>
                        <p className="text-muted-foreground">Waiting for the borrower to end the rental.</p>
                    </div>
                )}
                {isBorrower && (
                     <div className="w-full text-center space-y-4">
                        <h3 className="font-semibold text-lg">Rental in Progress</h3>
                        <p className="text-muted-foreground">Click the button below when you are ready to return the item.</p>
                        <Button onClick={handleEndRental} variant="outline" className="w-full" disabled={isEnding}>
                             {isEnding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            End Rental & Generate Return Code
                        </Button>
                    </div>
                )}
                </>
            )}
            
            {/* PENDING END */}
            {transaction.status === 'pending-end' && (
                 <>
                 {isLender && (
                     <div className="w-full space-y-4">
                         <p className="text-muted-foreground text-center">Enter the return code from the borrower to confirm the return.</p>
                         <div className="flex items-center gap-2">
                             <KeyRound className="text-muted-foreground" />
                             <Input type="text" maxLength={6} placeholder="Enter 6-digit code" value={enteredCode} onChange={e => setEnteredCode(e.target.value)} className="text-center text-lg tracking-widest" disabled={isVerifying} />
                         </div>
                         <Button onClick={handleConfirmReturn} className="w-full" disabled={isVerifying || enteredCode.length !== 6}>
                             {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Confirm Return
                         </Button>
                     </div>
                 )}
                 {isBorrower && (
                    <div className="w-full text-center">
                        <p className="text-muted-foreground mb-4">Share the new 6-digit code with the lender to complete the return.</p>
                         <div className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-lg w-full">
                             <p className="text-sm text-muted-foreground">Return Code</p>
                             <p className="text-4xl font-bold tracking-widest text-primary">{transaction.handshakeCode}</p>
                         </div>
                     </div>
                 )}
                 </>
            )}

            {/* COMPLETED */}
            {transaction.status === 'completed' && (
                <div className="text-center space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto"/>
                    <h3 className="font-semibold text-lg">Rental Completed!</h3>
                    <p className="text-muted-foreground">This transaction is now finished.</p>
                </div>
            )}
        </CardContent>
        {transaction.status === 'completed' && (
             <CardFooter>
                 <Button asChild variant="outline" className="w-full"><Link href="/history">View in History</Link></Button>
             </CardFooter>
        )}
      </Card>
    </div>
  );
}

    