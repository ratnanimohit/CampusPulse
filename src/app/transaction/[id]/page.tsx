'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
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
import { KeyRound, ArrowLeft, Loader2, CheckCircle, ShieldCheck, Hourglass, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


type Transaction = {
  id: string;
  lenderId: string;
  borrowerId: string;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  karma: number;
  status: 'pending-handshake' | 'active' | 'pending-end' | 'completed';
  handoverCode?: string;
  returnCode?: string;
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

  const [enteredCode, setEnteredCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const isLender = user?.uid === transaction?.lenderId;
  const isBorrower = user?.uid === transaction?.borrowerId;

  const handleAcceptRequest = async () => {
    if (!transactionDocRef || !isLender) return;
    setIsProcessing(true);
    try {
      const handoverCode = Math.floor(100000 + Math.random() * 900000).toString();
      await updateDoc(transactionDocRef, {
        status: 'active',
        handoverCode: handoverCode,
      });
      toast({ title: 'Request Accepted', description: 'Share the code with the borrower.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not accept the request.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyHandover = async () => {
    if (!transaction || !transactionDocRef || !isBorrower) return;
    setIsProcessing(true);
    if (enteredCode === transaction.handoverCode) {
      try {
        const batch = writeBatch(firestore);
        
        batch.update(transactionDocRef, { startTime: serverTimestamp() });
        
        if (transaction.originalRequestId) {
          const requestDocRef = doc(firestore, 'itemRequests', transaction.originalRequestId);
          batch.delete(requestDocRef);
        }

        await batch.commit();

        toast({ title: 'Rental Started!', description: `You are now borrowing ${transaction.itemName}.` });
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not start the rental.' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Incorrect Code', description: 'The code you entered is wrong.' });
    }
    setEnteredCode('');
    setIsProcessing(false);
  };
  
  const handleRequestReturn = async () => {
    if (!transactionDocRef || !isBorrower) return;
    setIsProcessing(true);
    try {
      const returnCode = Math.floor(100000 + Math.random() * 900000).toString();
      await updateDoc(transactionDocRef, {
        status: 'pending-end',
        returnCode: returnCode,
      });
      toast({ title: 'Return Requested', description: 'Share the new code with the lender.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not request the return.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyReturn = async () => {
    if (!transaction || !transactionDocRef || !isLender || !firestore) return;
    setIsProcessing(true);
    if (enteredCode === transaction.returnCode) {
      try {
        await updateDoc(transactionDocRef, {
          status: 'completed',
          actualEndTime: serverTimestamp(),
        });
        toast({ title: 'Rental Completed!', description: 'The item has been returned.' });
        router.push('/history');
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not complete the return.' });
      }
    } else {
      toast({ variant: 'destructive', title: 'Incorrect Code', description: 'The return code is incorrect.' });
    }
    setEnteredCode('');
    setIsProcessing(false);
  };

  const renderLenderView = () => {
    if (!transaction) return null;
    switch (transaction.status) {
      case 'pending-handshake':
        return (
          <CardContent className="w-full text-center space-y-4">
            <p className="text-muted-foreground">The borrower has been notified. Accept the request to generate the handover code.</p>
            <Button onClick={handleAcceptRequest} disabled={isProcessing} className="w-full">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Accept Request
            </Button>
          </CardContent>
        );
      case 'active':
        return (
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-center">Share this code with the borrower to start the rental.</p>
            <div className="p-4 border-2 border-dashed rounded-lg w-full text-center">
              <p className="text-sm text-muted-foreground">Handover Code</p>
              <p className="text-4xl font-bold tracking-widest text-primary">{transaction.handoverCode}</p>
            </div>
            <p className="text-muted-foreground text-center mt-4">Waiting for borrower to verify...</p>
          </CardContent>
        );
      case 'pending-end':
        return (
          <CardContent className="w-full space-y-4">
            <p className="text-muted-foreground text-center">Enter the return code from the borrower to complete the transaction.</p>
            <div className="flex items-center gap-2">
              <KeyRound className="text-muted-foreground" />
              <Input type="text" maxLength={6} placeholder="Enter 6-digit code" value={enteredCode} onChange={e => setEnteredCode(e.target.value)} className="text-center text-lg tracking-widest" disabled={isProcessing} />
            </div>
            <Button onClick={handleVerifyReturn} className="w-full" disabled={isProcessing || enteredCode.length !== 6}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Return
            </Button>
          </CardContent>
        );
      case 'completed':
        return (
          <CardContent className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto"/>
            <h3 className="font-semibold text-lg">Rental Completed!</h3>
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
          <CardContent className="text-center space-y-2">
            <Hourglass className="h-12 w-12 text-muted-foreground mx-auto"/>
            <h3 className="font-semibold text-lg">Waiting for Lender</h3>
            <p className="text-muted-foreground">The lender has been notified and needs to accept your request.</p>
          </CardContent>
        );
      case 'active':
        if (!transaction.startTime) {
          return (
            <CardContent className="w-full space-y-4">
              <p className="text-muted-foreground text-center">Enter the 6-digit code from the lender to start the rental.</p>
              <div className="flex items-center gap-2">
                <KeyRound className="text-muted-foreground" />
                <Input type="text" maxLength={6} placeholder="Enter 6-digit code" value={enteredCode} onChange={e => setEnteredCode(e.target.value)} className="text-center text-lg tracking-widest" disabled={isProcessing} />
              </div>
              <Button onClick={handleVerifyHandover} className="w-full" disabled={isProcessing || enteredCode.length !== 6}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Handover
              </Button>
            </CardContent>
          );
        }
        return (
          <CardContent className="w-full text-center space-y-4">
            <h3 className="font-semibold text-lg">Rental in Progress</h3>
            <p className="text-muted-foreground">Click below when you are ready to return the item.</p>
            <Button onClick={handleRequestReturn} variant="outline" className="w-full" disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request Return
            </Button>
          </CardContent>
        );
      case 'pending-end':
        return (
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-center">Share this new code with the lender to complete the return.</p>
            <div className="p-4 border-2 border-dashed rounded-lg w-full text-center">
              <p className="text-sm text-muted-foreground">Return Code</p>
              <p className="text-4xl font-bold tracking-widest text-primary">{transaction.returnCode}</p>
            </div>
          </CardContent>
        );
      case 'completed':
        return (
          <CardContent className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto"/>
            <h3 className="font-semibold text-lg">Rental Completed!</h3>
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
        {transaction?.status === 'completed' && (
             <CardFooter>
                <Button asChild variant="outline" className="w-full"><Link href="/history">View in History</Link></Button>
              </CardFooter>
        )}
      </Card>
    </div>
  );
}
