'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { simpleHash } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from './ui/badge';

export type Transaction = {
  id: string;
  fulfillerId: string;
  requesterId: string;
  itemId: string;
  itemName:string;
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
};

interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  if (!user || !firestore) {
    return <Loader2 className="animate-spin" />;
  }

  const isFulfiller = user.uid === transaction.fulfillerId;
  const isRequester = user.uid === transaction.requesterId;
  const transactionDocRef = doc(firestore, 'transactions', transaction.id);

  // -- Fulfiller Actions --
  const generateHandoverCode = async () => {
    setIsProcessing(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      await updateDoc(transactionDocRef, {
        status: 'HANDOVER_PENDING',
        handoverCodeHash: simpleHash(code),
        updatedAt: serverTimestamp(),
      });
      setGeneratedCode(code);
      toast({ title: 'Code Generated', description: 'Share this code with the requester.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setIsProcessing(false);
  };

  const verifyReturnCode = async () => {
    if (simpleHash(verificationCode) !== transaction.returnCodeHash) {
      toast({ variant: 'destructive', title: 'Invalid Return Code' });
      return;
    }
    setIsProcessing(true);
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
    setIsProcessing(false);
  };
  
   const handleCancel = async () => {
      setIsProcessing(true);
      try {
          await updateDoc(transactionDocRef, { status: 'CANCELLED', updatedAt: serverTimestamp() });
          toast({ title: 'Transaction Cancelled' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
      setIsProcessing(false);
  }

  // -- Requester Actions --
  const verifyHandoverCode = async () => {
    if (simpleHash(verificationCode) !== transaction.handoverCodeHash) {
      toast({ variant: 'destructive', title: 'Invalid Handover Code' });
      return;
    }
    setIsProcessing(true);
    try {
      await updateDoc(transactionDocRef, {
        handoverVerified: true,
        status: 'ACTIVE',
        updatedAt: serverTimestamp(),
      });
      if (transaction.itemId) {
        // This is a fire-and-forget delete.
        deleteDoc(doc(firestore, 'itemRequests', transaction.itemId)).catch(console.error);
      }
      toast({ title: 'Handover Complete!', description: 'You now have the item.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setIsProcessing(false);
  };

  const generateReturnCode = async () => {
    setIsProcessing(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      await updateDoc(transactionDocRef, {
        status: 'RETURN_PENDING',
        returnCodeHash: simpleHash(code),
        updatedAt: serverTimestamp(),
      });
      setGeneratedCode(code);
      toast({ title: 'Return Initiated', description: 'Share this code with the fulfiller.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setIsProcessing(false);
  };

  const renderFulfillerContent = () => {
    switch (transaction.status) {
      case 'CREATED':
        return <Button className="w-full" onClick={generateHandoverCode} disabled={isProcessing}>Generate Handover Code</Button>;
      case 'HANDOVER_PENDING':
        return <div className="text-center p-4 border-dashed border-2 rounded-lg">
            <p className="text-muted-foreground">Your handover code is:</p>
            <p className="text-4xl font-bold tracking-widest my-2">{generatedCode || '----'}</p>
            <p className="text-xs text-muted-foreground">Share this with the requester. Waiting for them to verify...</p>
          </div>
      case 'ACTIVE':
        return <p className="text-center text-muted-foreground">Item is with the requester. Waiting for them to initiate return.</p>;
      case 'RETURN_PENDING':
        return <div className="space-y-2">
            <Input type="text" placeholder="Enter 4-digit return code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} maxLength={4} className="text-center"/>
            <Button className="w-full" onClick={verifyReturnCode} disabled={isProcessing || verificationCode.length !== 4}>Verify Return</Button>
          </div>
      default: return null;
    }
  };

  const renderRequesterContent = () => {
    switch (transaction.status) {
      case 'CREATED':
      case 'HANDOVER_PENDING':
         if (!transaction.handoverCodeHash) {
            return <p className="text-center text-muted-foreground">Waiting for lender to generate handover code...</p>;
        }
        return <div className="space-y-2">
            <Input type="text" placeholder="Enter 4-digit handover code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} maxLength={4} className="text-center"/>
            <Button className="w-full" onClick={verifyHandoverCode} disabled={isProcessing || verificationCode.length !== 4}>Verify Handover</Button>
          </div>
      case 'ACTIVE':
        if(generatedCode){
             return <div className="text-center p-4 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">Your return code is:</p>
                <p className="text-4xl font-bold tracking-widest my-2">{generatedCode}</p>
                <p className="text-xs text-muted-foreground">Share this with the lender to complete the return.</p>
            </div>
        }
        return <Button className="w-full" onClick={generateReturnCode} disabled={isProcessing}>Initiate Return & Generate Code</Button>;
      case 'RETURN_PENDING':
         return <div className="text-center p-4 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">Your return code is:</p>
                <p className="text-4xl font-bold tracking-widest my-2">{generatedCode || '----'}</p>
                <p className="text-xs text-muted-foreground">Waiting for lender to verify...</p>
            </div>
      default: return null;
    }
  };

  const getStatusBadgeVariant = () => {
      switch (transaction.status) {
          case 'ACTIVE': return 'default';
          case 'HANDOVER_PENDING':
          case 'RETURN_PENDING': return 'secondary';
          default: return 'outline';
      }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2">
           <Image src={transaction.itemImageUrl} alt={transaction.itemName} layout="fill" objectFit="cover" data-ai-hint="item"/>
        </div>
        <CardTitle className="font-headline text-xl">{transaction.itemName}</CardTitle>
        <div className="flex justify-between items-center">
            <Badge variant={getStatusBadgeVariant()}>{transaction.status.replace(/_/g, ' ')}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <KeyRound className="h-4 w-4" />
                <span className="font-bold text-primary">{transaction.karma}</span> Karma
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
          {isProcessing && <div className="flex justify-center mb-2"><Loader2 className="animate-spin" /></div>}
          {isFulfiller && renderFulfillerContent()}
          {isRequester && renderRequesterContent()}
      </CardContent>
       {(transaction.status === 'CREATED' || transaction.status === 'HANDOVER_PENDING') && (
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={handleCancel} disabled={isProcessing}>Cancel Transaction</Button>
          </CardFooter>
      )}
    </Card>
  );
}
