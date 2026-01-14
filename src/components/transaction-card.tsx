'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, CheckCircle, Info, ShieldX } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
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

interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const isLender = user?.uid === transaction.lenderId;
  const isBorrower = user?.uid === transaction.borrowerId;

  const transactionDocRef = doc(firestore, 'transactions', transaction.id);

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      if (isLender) {
        if (transaction.status === 'CREATED') await generateHandoverCode();
        if (transaction.status === 'RETURN_PENDING') await verifyReturnCode();
      } else if (isBorrower) {
        if (transaction.status === 'HANDOVER_PENDING') await verifyHandoverCode();
        if (transaction.status === 'ACTIVE') await generateReturnCode();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error.message || 'Could not complete the action. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const generateHandoverCode = async () => {
    if (transaction.status !== 'CREATED') return;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await updateDoc(transactionDocRef, {
      status: 'HANDOVER_PENDING',
      handoverCodeHash: simpleHash(code),
      updatedAt: serverTimestamp(),
    });
    setGeneratedCode(code);
    toast({ title: 'Code Generated', description: 'Share this code with the borrower.' });
  };
  
  const verifyHandoverCode = async () => {
    if (transaction.status !== 'HANDOVER_PENDING') return;
    if (simpleHash(codeInput) === transaction.handoverCodeHash) {
      await updateDoc(transactionDocRef, {
        handoverVerified: true,
        status: 'ACTIVE',
        updatedAt: serverTimestamp(),
      });
      // Delete the original item request
      if (transaction.itemId) {
          const requestDocRef = doc(firestore, 'itemRequests', transaction.itemId);
          await deleteDoc(requestDocRef);
      }
      toast({ title: 'Success!', description: 'Handover complete.' });
    } else {
      toast({ variant: 'destructive', title: 'Invalid Code' });
    }
  };
  
  const generateReturnCode = async () => {
    if (transaction.status !== 'ACTIVE') return;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await updateDoc(transactionDocRef, {
      status: 'RETURN_PENDING',
      returnCodeHash: simpleHash(code),
      updatedAt: serverTimestamp(),
    });
    setGeneratedCode(code);
    toast({ title: 'Return Initiated', description: 'Share this code with the lender.' });
  };

  const verifyReturnCode = async () => {
    if (transaction.status !== 'RETURN_PENDING') return;
    if (simpleHash(codeInput) === transaction.returnCodeHash) {
      await updateDoc(transactionDocRef, {
        returnVerified: true,
        status: 'COMPLETED',
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Transaction Completed!', description: `${transaction.karma} karma awarded.` });
    } else {
      toast({ variant: 'destructive', title: 'Invalid Code' });
    }
  };

  const handleCancelTransaction = async () => {
    if (transaction.status !== 'CREATED' && transaction.status !== 'HANDOVER_PENDING') {
      toast({
        variant: 'destructive',
        title: 'Cannot Cancel',
        description: 'This transaction is already in progress.',
      });
      return;
    }
    await updateDoc(transactionDocRef, { status: 'CANCELLED', updatedAt: serverTimestamp() });
    toast({ title: 'Transaction Cancelled' });
  };

  const getStatusInfo = (): { text: string; color: 'blue' | 'yellow' | 'green' | 'gray' } => {
    switch (transaction.status) {
      case 'CREATED':
        return { text: isLender ? 'You need to generate a handover code.' : 'Waiting for lender to generate code.', color: 'yellow' };
      case 'HANDOVER_PENDING':
        return { text: isLender ? 'Waiting for borrower to verify.' : 'You need to enter the handover code.', color: 'yellow' };
      case 'ACTIVE':
        return { text: isLender ? 'Item is with the borrower.' : 'You have the item. Generate a return code when ready.', color: 'blue' };
      case 'RETURN_PENDING':
        return { text: isLender ? 'You need to enter the return code.' : 'Waiting for lender to verify return.', color: 'yellow' };
      case 'COMPLETED':
        return { text: 'Transaction completed.', color: 'green' };
      default:
        return { text: 'Status unknown.', color: 'gray' };
    }
  };
  
  const getButtonInfo = (): { text: string; disabled: boolean } => {
     if (isLender) {
         if (transaction.status === 'CREATED') return { text: 'Generate Handover Code', disabled: false };
         if (transaction.status === 'RETURN_PENDING') return { text: 'Verify Return Code', disabled: codeInput.length !== 4};
     }
     if (isBorrower) {
         if (transaction.status === 'HANDOVER_PENDING') return { text: 'Verify Handover Code', disabled: codeInput.length !== 4};
         if (transaction.status === 'ACTIVE') return { text: 'Generate Return Code', disabled: false};
     }
     return { text: 'No action needed', disabled: true };
  };

  const statusInfo = getStatusInfo();
  const buttonInfo = getButtonInfo();

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle className="font-headline text-xl">{transaction.itemName}</CardTitle>
                 <CardDescription>
                    Role: <Badge variant="outline">{isLender ? 'Lender' : 'Borrower'}</Badge>
                 </CardDescription>
            </div>
            <Badge variant={
                statusInfo.color === 'green' ? 'default'
                : statusInfo.color === 'yellow' ? 'secondary'
                : 'outline'
            }>{transaction.status.replace('_', ' ')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="relative w-full h-40 rounded-lg overflow-hidden">
            <Image src={transaction.itemImageUrl} alt={transaction.itemName} layout="fill" objectFit="cover" data-ai-hint="item" />
        </div>
        
        <div className={`p-3 rounded-md bg-${statusInfo.color}-100 dark:bg-${statusInfo.color}-900/50 border border-${statusInfo.color}-200 dark:border-${statusInfo.color}-800`}>
            <p className={`text-sm font-medium text-${statusInfo.color}-800 dark:text-${statusInfo.color}-200`}>{statusInfo.text}</p>
        </div>

        {generatedCode && (
            <div className="p-4 border-2 border-dashed rounded-lg w-full text-center bg-background">
                <p className="text-sm text-muted-foreground">Share this code</p>
                <p className="text-5xl font-bold tracking-widest text-primary">{generatedCode}</p>
            </div>
        )}

        {( (isLender && transaction.status === 'RETURN_PENDING') || (isBorrower && transaction.status === 'HANDOVER_PENDING') ) && (
            <div className="space-y-2">
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 4-digit code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                    className="text-center text-lg tracking-widest"
                    disabled={isProcessing}
                />
            </div>
        )}

      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        {!buttonInfo.disabled ? (
            <Button className="w-full" onClick={handleAction} disabled={isProcessing || buttonInfo.disabled}>
              {isProcessing ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
              {buttonInfo.text}
            </Button>
        ) : (
            <Button className="w-full" variant="secondary" disabled>
                <Info className="mr-2" />
                {buttonInfo.text}
            </Button>
        )}

        {(transaction.status === 'CREATED' || transaction.status === 'HANDOVER_PENDING') && (
            <Button variant="destructive" size="sm" className="w-full" onClick={handleCancelTransaction} disabled={isProcessing}>
                <ShieldX className="mr-2" />
                Cancel Transaction
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}
