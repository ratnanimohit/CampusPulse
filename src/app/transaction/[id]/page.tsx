'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, serverTimestamp, updateDoc, runTransaction, increment, deleteDoc, writeBatch } from 'firebase/firestore';
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
import { ArrowLeft, Loader2, CheckCircle, Info, ShieldX, Send, CornerDownRight, KeyRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Transaction = {
  id: string;
  lenderId: string;
  borrowerId: string;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  karma: number;
  status: 'pending-handshake' | 'active' | 'pending-end' | 'completed' | 'cancelled';
  handoverCode?: string;
  returnCode?: string;
  startTime?: any;
  actualEndTime?: any;
  originalRequestId?: string;
};


// Lender's dedicated view component
function LenderView({ transaction, transactionDocRef, firestore, isProcessing, setIsProcessing }: { transaction: Transaction, transactionDocRef: any, firestore: any, isProcessing: boolean, setIsProcessing: (isProcessing: boolean) => void }) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyReturnCode = async () => {
    if (!transaction || !transactionDocRef || !firestore) return;
    const enteredPin = pin.join('');
    if (enteredPin.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'Please enter all 6 digits.' });
      return;
    }
    
    setIsProcessing(true);

    if (enteredPin === transaction.returnCode) {
      try {
        await runTransaction(firestore, async (t) => {
          const lenderProfileRef = doc(firestore, 'userProfiles', transaction.lenderId);
          const borrowerProfileRef = doc(firestore, 'userProfiles', transaction.borrowerId);

          t.update(transactionDocRef, {
            status: 'completed',
            actualEndTime: serverTimestamp(),
          });
          
          t.update(lenderProfileRef, { karmaPoints: increment(transaction.karma || 10) });
          t.update(borrowerProfileRef, { karmaPoints: increment(transaction.karma || 10) });
        });

        toast({ title: 'Success!', description: 'Transaction completed.' });
      } catch (error) {
        console.error("Transaction completion error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not complete the transaction.' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'The return code is incorrect.' });
      setPin(['', '', '', '', '', '']); // Reset PIN on failure
      inputRefs.current[0]?.focus();
    }
    setIsProcessing(false);
  };
  
  const handleAcceptRequest = async () => {
    setIsProcessing(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await updateDoc(transactionDocRef, {
        handoverCode: code,
        status: 'active'
      });
      toast({ title: 'Request Accepted', description: 'Share the handover code with the borrower.' });
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not accept the request.' });
    }
    setIsProcessing(false);
  };

  switch (transaction.status) {
    case 'pending-handshake':
      return (
        <CardContent className="flex flex-col items-center gap-4">
           <Info className="h-8 w-8 text-blue-500"/>
          <p className="text-muted-foreground text-center">You need to accept this request to generate a handover code for the borrower.</p>
          <Button onClick={handleAcceptRequest} className="w-full" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Accept Request
          </Button>
        </CardContent>
      );
    case 'active':
        return (
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-center">Share this code with the borrower to hand over the item.</p>
            <div className="p-4 border-2 border-dashed rounded-lg w-full text-center">
              <p className="text-sm text-muted-foreground">Handover Code</p>
              <p className="text-5xl font-bold tracking-widest text-primary">{transaction.handoverCode}</p>
            </div>
            <p className="text-muted-foreground text-center mt-4">Waiting for borrower to verify...</p>
          </CardContent>
        );
    case 'pending-end':
       return (
        <CardContent className="w-full space-y-4">
          <p className="text-muted-foreground text-center">Enter the 6-digit code from the borrower to confirm the item return.</p>
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
          <Button onClick={handleVerifyReturnCode} className="w-full" disabled={isProcessing || pin.join('').length !== 6}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Return
          </Button>
        </CardContent>
      );
    case 'completed':
      return (
        <CardContent className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto"/>
          <h3 className="font-semibold text-lg">Transaction Completed!</h3>
          <p className="text-muted-foreground">{transaction.karma} karma points awarded.</p>
        </CardContent>
      );
    default:
      return null;
  }
}

// Borrower's dedicated view component
function BorrowerView({ transaction, transactionDocRef, firestore, isProcessing, setIsProcessing }: { transaction: Transaction, transactionDocRef: any, firestore: any, isProcessing: boolean, setIsProcessing: (isProcessing: boolean) => void }) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  const handlePinChange = (index: number, value: string) => {
     if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyStartCode = async () => {
    if (!transaction || !transactionDocRef || !firestore) return;
    const enteredPin = pin.join('');
    if (enteredPin.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'Please enter all 6 digits.' });
      return;
    }
    
    setIsProcessing(true);

    if (enteredPin === transaction.handoverCode) {
      try {
        const batch = writeBatch(firestore);
        
        batch.update(transactionDocRef, {
            startTime: serverTimestamp(),
        });
        
        // Delete original request now
        if (transaction.originalRequestId) {
          const requestDocRef = doc(firestore, 'itemRequests', transaction.originalRequestId);
          batch.delete(requestDocRef);
        }

        await batch.commit();

        toast({ title: 'Success!', description: 'Item received. The rental period has started.' });
      } catch (error) {
        console.error("Handover verification error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not start the rental.' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'The handover code is incorrect.' });
      setPin(['', '', '', '', '', '']); // Reset PIN on failure
      inputRefs.current[0]?.focus();
    }
    setIsProcessing(false);
  };
  
  const handleRequestReturn = async () => {
    setIsProcessing(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await updateDoc(transactionDocRef, {
        returnCode: code,
        status: 'pending-end'
      });
      toast({ title: 'Return Initiated', description: 'Share the return code with the lender.' });
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not initiate the return.' });
    }
    setIsProcessing(false);
  };


  switch (transaction.status) {
    case 'pending-handshake':
      return (
         <CardContent className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
            <p className="text-muted-foreground">Waiting for the lender to accept the request and provide a handover code.</p>
        </CardContent>
      );
    case 'active':
      if (!transaction.startTime) {
         return (
          <CardContent className="w-full space-y-4">
            <p className="text-muted-foreground text-center">Enter the 6-digit code from the lender to receive the item.</p>
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
            <Button onClick={handleVerifyStartCode} className="w-full" disabled={isProcessing || pin.join('').length !== 6}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Code
            </Button>
          </CardContent>
        );
      }
      // Rental is active and started
      return (
         <CardContent className="flex flex-col items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-500"/>
            <p className="text-muted-foreground text-center">Item received. Press the button below when you are ready to return it.</p>
            <Button onClick={handleRequestReturn} className="w-full" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CornerDownRight className="mr-2 h-4 w-4" />}
                Request Return
            </Button>
        </CardContent>
      )
    case 'pending-end':
       return (
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-center">Share this return code with the lender to complete the transaction.</p>
            <div className="p-4 border-2 border-dashed rounded-lg w-full text-center">
              <p className="text-sm text-muted-foreground">Return Code</p>
              <p className="text-5xl font-bold tracking-widest text-primary">{transaction.returnCode}</p>
            </div>
            <p className="text-muted-foreground text-center mt-4">Waiting for lender to confirm...</p>
          </CardContent>
        );
    case 'completed':
      return (
        <CardContent className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto"/>
          <h3 className="font-semibold text-lg">Transaction Completed!</h3>
          <p className="text-muted-foreground">{transaction.karma} karma points awarded.</p>
        </CardContent>
      );
    default:
      return null;
  }
}

export default function TransactionPage() {
  const { id: transactionId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const transactionDocRef = useMemoFirebase(
    () => firestore && transactionId ? doc(firestore, 'transactions', transactionId as string) : null,
    [firestore, transactionId]
  );

  const { data: transaction, isLoading } = useDoc<Transaction>(transactionDocRef);
  const [isProcessing, setIsProcessing] = useState(false);

  const isLender = user?.uid === transaction?.lenderId;
  const isBorrower = user?.uid === transaction?.borrowerId;

  const handleCancelTransaction = async () => {
    if (!transactionDocRef) return;
    setIsProcessing(true);
    try {
        await updateDoc(transactionDocRef, { status: 'cancelled' });
        toast({ title: 'Transaction Cancelled' });
        router.push('/dashboard');
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not cancel transaction.' });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const isCancellable = transaction && (transaction.status === 'pending-handshake' || transaction.status === 'active' || transaction.status === 'pending-end');

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex min-h-[200px] items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
    }
    if (!transaction || transaction.status === 'cancelled') {
        return (
          <CardContent className="text-center">
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Transaction Not Found</AlertTitle>
                <AlertDescription>
                    This transaction may have been cancelled or does not exist.
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

    // Delegate rendering to the appropriate view component
    if (isLender) {
      return <LenderView transaction={transaction} transactionDocRef={transactionDocRef} firestore={firestore} isProcessing={isProcessing} setIsProcessing={setIsProcessing} />;
    }

    if (isBorrower) {
      return <BorrowerView transaction={transaction} transactionDocRef={transactionDocRef} firestore={firestore} isProcessing={isProcessing} setIsProcessing={setIsProcessing} />;
    }

    return null;
  };

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
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <KeyRound/>
            Transaction Handshake
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

    