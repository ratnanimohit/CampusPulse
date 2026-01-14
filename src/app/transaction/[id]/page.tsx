'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
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
import { Loader2, CheckCircle, ShieldX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { simpleHash } from '@/lib/utils';
import Image from 'next/image';

export type Transaction = {
  id: string;
  lenderId: string;
  borrowerId: string;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  karma: number;
  status:
    | 'CREATED'
    | 'HANDOVER_PENDING'
    | 'ACTIVE'
    | 'RETURN_PENDING'
    | 'COMPLETED'
    | 'CANCELLED';
  handoverCodeHash: string | null;
  handoverVerified: boolean;
  returnCodeHash: string | null;
  returnVerified: boolean;
  createdAt: any;
  updatedAt: any;
};

// Main page component
export default function TransactionPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const transactionId = params.id as string;

  const transactionDocRef = useMemoFirebase(
    () => (firestore && transactionId ? doc(firestore, 'transactions', transactionId) : null),
    [firestore, transactionId]
  );

  const { data: transaction, isLoading, error } = useDoc<Transaction>(transactionDocRef);

  if (isLoading || isUserLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Could not load transaction details.</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!transaction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The requested transaction does not exist or you may not have permission to view it.</p>
        </CardContent>
      </Card>
    );
  }

  const isLender = user?.uid === transaction.lenderId;
  const isBorrower = user?.uid === transaction.borrowerId;

  return (
    <div className="max-w-md mx-auto">
       <Card>
          <CardHeader>
             <CardTitle className="font-headline text-2xl">{transaction.itemName}</CardTitle>
             <CardDescription>
                Complete the steps below to securely exchange the item.
             </CardDescription>
          </CardHeader>
           <CardContent>
              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                  <Image src={transaction.itemImageUrl} alt={transaction.itemName} layout="fill" objectFit="cover" data-ai-hint="item" />
              </div>
              {isLender && <LenderView transaction={transaction} />}
              {isBorrower && <BorrowerView transaction={transaction} />}
           </CardContent>
       </Card>
    </div>
  );
}

// Lender's View Component
function LenderView({ transaction }: { transaction: Transaction }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [returnCodeInput, setReturnCodeInput] = useState('');
  const { toast } = useToast();
  const transactionDocRef = doc(useFirestore(), 'transactions', transaction.id);

  const generateHandoverCode = async () => {
    if (transaction.status !== 'CREATED') {
        toast({ variant: 'destructive', title: 'Invalid action.'});
        return;
    }
    setIsProcessing(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      await updateDoc(transactionDocRef, {
        status: 'HANDOVER_PENDING',
        handoverCodeHash: simpleHash(code),
        updatedAt: serverTimestamp(),
      });
      setGeneratedCode(code);
      toast({ title: 'Code Generated', description: 'Share this code with the borrower.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyReturnCode = async () => {
     if (transaction.status !== 'RETURN_PENDING' || !transaction.returnCodeHash) {
        toast({ variant: 'destructive', title: 'Invalid state for verification.'});
        return;
    }
    setIsProcessing(true);
    if (simpleHash(returnCodeInput) === transaction.returnCodeHash) {
      try {
        await updateDoc(transactionDocRef, {
          returnVerified: true,
          status: 'COMPLETED',
          updatedAt: serverTimestamp(),
        });
        toast({ title: 'Transaction Completed!', description: `${transaction.karma} karma awarded.` });
      } catch (error: any) {
         toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    } else {
      toast({ variant: 'destructive', title: 'Invalid Return Code' });
    }
    setIsProcessing(false);
  };
  
  const handleCancel = async () => {
      if(transaction.status !== 'CREATED' && transaction.status !== 'HANDOVER_PENDING'){
          toast({ variant: 'destructive', title: 'Cannot cancel an active transaction.'});
          return;
      }
      setIsProcessing(true);
      try {
          await updateDoc(transactionDocRef, { status: 'CANCELLED', updatedAt: serverTimestamp() });
          toast({ title: 'Transaction Cancelled' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
      setIsProcessing(false);
  }

  const renderContent = () => {
    switch (transaction.status) {
      case 'CREATED':
        return (
          <Button className="w-full" onClick={generateHandoverCode} disabled={isProcessing}>
            {isProcessing && <Loader2 className="animate-spin mr-2" />}
            Generate Handover Code
          </Button>
        );
      case 'HANDOVER_PENDING':
        return (
          <div className="text-center p-4 border-dashed border-2 rounded-lg">
            <p className="text-muted-foreground">Your handover code is:</p>
            <p className="text-4xl font-bold tracking-widest my-2">{generatedCode || '----'}</p>
            <p className="text-muted-foreground">Waiting for borrower to verify...</p>
          </div>
        );
      case 'ACTIVE':
        return (
          <div className="text-center p-4 bg-secondary rounded-lg">
            <p className="font-medium">Item is with the borrower.</p>
            <p className="text-sm text-muted-foreground">Waiting for them to initiate the return.</p>
          </div>
        );
      case 'RETURN_PENDING':
         return (
            <div className="space-y-4">
              <p className="text-muted-foreground text-center">
                Enter the 4-digit return code provided by the borrower.
              </p>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="••••"
                maxLength={4}
                value={returnCodeInput}
                onChange={(e) =>
                  setReturnCodeInput(e.target.value.replace(/\D/g, ''))
                }
                className="text-center text-2xl tracking-widest"
              />
              <Button
                className="w-full"
                disabled={returnCodeInput.length !== 4 || isProcessing}
                onClick={verifyReturnCode}
              >
                {isProcessing && <Loader2 className="animate-spin mr-2" />}
                Verify Return & Complete
              </Button>
            </div>
          );
      case 'COMPLETED':
        return (
          <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-700 dark:text-green-300 flex items-center justify-center gap-2">
            <CheckCircle />
            <p className="font-medium">Transaction Completed</p>
          </div>
        );
      case 'CANCELLED':
         return (
            <div className="text-center p-4 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-700 dark:text-red-300 flex items-center justify-center gap-2">
                <ShieldX />
                <p className="font-medium">Transaction Cancelled</p>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderContent()}
      {(transaction.status === 'CREATED' || transaction.status === 'HANDOVER_PENDING') && (
          <Button variant="ghost" size="sm" className="w-full mt-2" onClick={handleCancel}>Cancel</Button>
      )}
    </>
  );
}

// Borrower's View Component
function BorrowerView({ transaction }: { transaction: Transaction }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [handoverCodeInput, setHandoverCodeInput] = useState('');
  const [generatedReturnCode, setGeneratedReturnCode] = useState<string | null>(null);
  const { toast } = useToast();
  const transactionDocRef = doc(useFirestore(), 'transactions', transaction.id);

  const verifyHandoverCode = async () => {
    if (transaction.status !== 'HANDOVER_PENDING' || !transaction.handoverCodeHash) {
        toast({ variant: 'destructive', title: 'Not ready for verification.'});
        return;
    }
    setIsProcessing(true);
    if (simpleHash(handoverCodeInput) === transaction.handoverCodeHash) {
      try {
        await updateDoc(transactionDocRef, {
          handoverVerified: true,
          status: 'ACTIVE',
          updatedAt: serverTimestamp(),
        });
        // Non-blocking delete of the original item request
        if (transaction.itemId) {
            deleteDoc(doc(useFirestore(), 'itemRequests', transaction.itemId)).catch(console.error);
        }
        toast({ title: 'Success!', description: 'Handover complete. You now have the item.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    } else {
      toast({ variant: 'destructive', title: 'Invalid Handover Code' });
    }
    setIsProcessing(false);
  };
  
  const generateReturnCode = async () => {
      if (transaction.status !== 'ACTIVE') {
        toast({ variant: 'destructive', title: 'Invalid action.'});
        return;
    }
    setIsProcessing(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    try {
        await updateDoc(transactionDocRef, {
            status: 'RETURN_PENDING',
            returnCodeHash: simpleHash(code),
            updatedAt: serverTimestamp(),
        });
        setGeneratedReturnCode(code);
        toast({ title: 'Return Initiated', description: 'Share the return code with the lender.' });
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setIsProcessing(false);
  };

  const renderContent = () => {
    switch (transaction.status) {
      case 'CREATED':
      case 'HANDOVER_PENDING':
        if (!transaction.handoverCodeHash) {
            return (
              <div className="text-center p-4">
                <Loader2 className="animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">
                  Waiting for lender to generate handover code…
                </p>
              </div>
            );
        }
        return (
            <div className="space-y-4">
                <p className="text-muted-foreground text-center">
                    Enter the 4-digit handover code from the lender.
                </p>
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="••••"
                    maxLength={4}
                    value={handoverCodeInput}
                    onChange={(e) =>
                    setHandoverCodeInput(e.target.value.replace(/\D/g, ''))
                    }
                    className="text-center text-2xl tracking-widest"
                />
                <Button
                    className="w-full"
                    disabled={handoverCodeInput.length !== 4 || isProcessing}
                    onClick={verifyHandoverCode}
                >
                     {isProcessing && <Loader2 className="animate-spin mr-2" />}
                    Verify Handover
                </Button>
            </div>
        );
      case 'ACTIVE':
        if (generatedReturnCode) {
             return (
                <div className="text-center p-4 border-dashed border-2 rounded-lg">
                    <p className="text-muted-foreground">Your return code is:</p>
                    <p className="text-4xl font-bold tracking-widest my-2">{generatedReturnCode}</p>
                    <p className="text-muted-foreground">Share this with the lender to complete the return.</p>
                </div>
            );
        }
        return (
          <Button className="w-full" onClick={generateReturnCode} disabled={isProcessing}>
            {isProcessing && <Loader2 className="animate-spin mr-2" />}
            Generate Return Code
          </Button>
        );
      case 'RETURN_PENDING':
        return (
            <div className="text-center p-4 bg-secondary rounded-lg">
                <p className="font-medium">Return Initiated</p>
                <p className="text-sm text-muted-foreground">Waiting for lender to verify the return code.</p>
            </div>
        );
      case 'COMPLETED':
        return (
          <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-700 dark:text-green-300 flex items-center justify-center gap-2">
            <CheckCircle />
            <p className="font-medium">Transaction Completed</p>
          </div>
        );
       case 'CANCELLED':
         return (
            <div className="text-center p-4 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-700 dark:text-red-300 flex items-center justify-center gap-2">
                <ShieldX />
                <p className="font-medium">Transaction Cancelled</p>
            </div>
        );
      default:
        return null;
    }
  };

  return <>{renderContent()}</>;
}

    