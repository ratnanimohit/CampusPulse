'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, serverTimestamp, updateDoc, writeBatch, runTransaction, increment } from 'firebase/firestore';
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
import { KeyRound, ArrowLeft, Loader2, CheckCircle, Info, ShieldX } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Transaction = {
  id: string;
  lenderId: string;
  borrowerId: string;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  karma: number;
  status: 'pending-handshake' | 'completed';
  pin?: string;
  startTime?: any;
  actualEndTime?: any;
  originalRequestId?: string;
};

export default function TransactionPage() {
  const { id: transactionId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const transactionDocRef = useMemoFirebase(
    () =>
      firestore && transactionId
        ? doc(firestore, 'transactions', transactionId as string)
        : null,
    [firestore, transactionId]
  );

  const { data: transaction, isLoading } = useDoc<Transaction>(transactionDocRef);

  const [pin, setPin] = useState(['', '', '', '']);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isLender = user?.uid === transaction?.lenderId;
  const isBorrower = user?.uid === transaction?.borrowerId;

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyPin = async () => {
    if (!transaction || !transactionDocRef || !isBorrower || !firestore) return;
    const enteredPin = pin.join('');
    if (enteredPin.length !== 4) {
      toast({ variant: 'destructive', title: 'Invalid PIN', description: 'Please enter all 4 digits.' });
      return;
    }
    
    setIsProcessing(true);

    if (enteredPin === transaction.pin) {
      try {
        await runTransaction(firestore, async (t) => {
          const lenderProfileRef = doc(firestore, 'userProfiles', transaction.lenderId);
          const borrowerProfileRef = doc(firestore, 'userProfiles', transaction.borrowerId);
          const requestDocRef = doc(firestore, 'itemRequests', transaction.originalRequestId!);

          t.update(transactionDocRef, {
            status: 'completed',
            actualEndTime: serverTimestamp(),
            startTime: serverTimestamp(), // For simplicity, start and end are the same time
          });
          
          t.update(lenderProfileRef, { karmaPoints: increment(transaction.karma || 10) });
          t.update(borrowerProfileRef, { karmaPoints: increment(transaction.karma || 10) });
          
          t.delete(requestDocRef);
        });

        toast({ title: 'Success!', description: 'Transaction completed.' });
      } catch (error) {
        console.error("Transaction completion error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not complete the transaction.' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Invalid PIN', description: 'The PIN you entered is incorrect.' });
      setPin(['', '', '', '']); // Reset PIN on failure
      inputRefs.current[0]?.focus();
    }
    setIsProcessing(false);
  };
  
  const handleCancelTransaction = async () => {
    if (!transactionDocRef) return;
    setIsProcessing(true);
    try {
        await updateDoc(transactionDocRef, { status: 'cancelled' });
        // Ideally, also update the original item listing to be available again
        toast({ title: 'Transaction Cancelled' });
        router.push('/dashboard');
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not cancel transaction.' });
    } finally {
        setIsProcessing(false);
    }
  }


  const renderLenderView = () => {
    if (!transaction) return null;
    switch (transaction.status) {
      case 'pending-handshake':
        return (
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-center">Provide this 4-digit PIN to the borrower to complete the transaction.</p>
            <div className="p-4 border-2 border-dashed rounded-lg w-full text-center">
              <p className="text-sm text-muted-foreground">Handover PIN</p>
              <p className="text-5xl font-bold tracking-widest text-primary">{transaction.pin}</p>
            </div>
            <p className="text-muted-foreground text-center mt-4">Waiting for borrower to verify...</p>
          </CardContent>
        );
      case 'completed':
        return (
          <CardContent className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto"/>
            <h3 className="font-semibold text-lg">Transaction Completed!</h3>
          </CardContent>
        );
      default: return null;
    }
  };

  const renderBorrowerView = () => {
    if (!transaction) return null;
    switch (transaction.status) {
      case 'pending-handshake':
        return (
          <CardContent className="w-full space-y-4">
            <p className="text-muted-foreground text-center">Enter the 4-digit PIN from the lender to verify the handover.</p>
            <div className="flex justify-center gap-2">
              {pin.map((digit, index) => (
                <Input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  className="w-12 h-14 text-center text-2xl font-bold"
                  disabled={isProcessing}
                />
              ))}
            </div>
            <Button onClick={handleVerifyPin} className="w-full" disabled={isProcessing || pin.join('').length !== 4}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify PIN
            </Button>
          </CardContent>
        );
      case 'completed':
        return (
          <CardContent className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto"/>
            <h3 className="font-semibold text-lg">Transaction Completed!</h3>
          </CardContent>
        );
      default: return null;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex min-h-[200px] items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }
    if (!transaction) {
        return (
          <CardContent className="text-center">
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Transaction Not Found</AlertTitle>
                <AlertDescription>
                    This transaction may have been canceled or does not exist.
                </AlertDescription>
            </Alert>
          </CardContent>
        );
    }
    if (!isLender && !isBorrower) {
      return (
        <CardContent className="text-center">
             <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You are not a participant in this transaction.
                </AlertDescription>
            </Alert>
        </CardContent>
      );
    }

    if (isLender) {
      return renderLenderView();
    }

    if (isBorrower) {
      return renderBorrowerView();
    }

    return null;
  };
  
  const isCancellable = transaction && transaction.status === 'pending-handshake';

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
            PIN Verification
          </CardTitle>
           <CardDescription>
            For {transaction?.itemName || '...'}
          </CardDescription>
        </CardHeader>
        {transaction && (
             <CardContent className="flex flex-col items-center gap-6 pt-6">
                <div className="relative w-48 h-48">
                    <Image src={transaction?.itemImageUrl || `https://picsum.photos/seed/${transactionId}/320/180`} alt={transaction?.itemName || 'Item Image'} layout="fill" objectFit="cover" className="rounded-lg" data-ai-hint="item"/>
                </div>
            </CardContent>
        )}
        {renderContent()}
        <CardFooter className="flex flex-col gap-2">
            {transaction?.status === 'completed' && (
                <Button asChild variant="outline" className="w-full"><Link href="/history">View in History</Link></Button>
            )}
            {isCancellable && (
                <Button variant="destructive" className="w-full" onClick={handleCancelTransaction} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldX className="mr-2 h-4 w-4"/>}
                    Cancel Transaction
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}

    