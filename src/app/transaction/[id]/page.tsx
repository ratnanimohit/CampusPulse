'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
import { ArrowLeft, Loader2, CheckCircle, Info, ShieldX, KeyRound, Send } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { simpleHash } from '@/lib/utils';

type Transaction = {
  id: string;
  lenderId: string;
  borrowerId: string;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  karma: number;
  status: 'CREATED' | 'HANDOVER_PENDING' | 'ACTIVE' | 'RETURN_PENDING' | 'COMPLETED' | 'CANCELLED';
  handoverCodeHash: string | null;
  handoverVerified: boolean;
  returnCodeHash: string | null;
  returnVerified: boolean;
  createdAt: any;
  updatedAt: any;
};

// --- Lender View ---
function LenderView({ transaction, transactionDocRef }: { transaction: Transaction, transactionDocRef: any }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [handoverCode, setHandoverCode] = useState<string | null>(null);
    const [returnCodeInput, setReturnCodeInput] = useState('');
    const { toast } = useToast();

    const generateHandoverCode = async () => {
        setIsProcessing(true);
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setHandoverCode(code);
        try {
            await updateDoc(transactionDocRef, {
              status: "HANDOVER_PENDING",
              handoverCodeHash: simpleHash(code),
              updatedAt: serverTimestamp(),
            });
            toast({ title: "Code Generated", description: "Share this code with the borrower." });
        } catch (error) {
            console.error("generateHandoverCode error:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not generate code." });
        }
        setIsProcessing(false);
    };

    const verifyReturnCode = async () => {
      if (returnCodeInput.length !== 4) {
          toast({ variant: 'destructive', title: "Invalid Code", description: "Please enter a 4-digit code." });
          return;
      }
      setIsProcessing(true);
      if (simpleHash(returnCodeInput) === transaction.returnCodeHash) {
          try {
              await updateDoc(transactionDocRef, {
                  returnVerified: true,
                  status: 'COMPLETED',
                  updatedAt: serverTimestamp()
              });
              toast({ title: "Success!", description: "Return verified. Transaction completed." });
          } catch (error) {
              console.error("Verification error:", error);
              toast({ variant: 'destructive', title: "Error", description: "Could not complete transaction." });
          }
      } else {
          toast({ variant: 'destructive', title: "Invalid Code", description: "The code does not match." });
      }
      setIsProcessing(false);
  };


    switch (transaction.status) {
        case 'CREATED':
            return (
                <CardContent className="flex flex-col items-center gap-4">
                    <Info className="h-8 w-8 text-blue-500" />
                    <p className="text-muted-foreground text-center">Press the button below to generate a handover code for the borrower.</p>
                    <Button onClick={generateHandoverCode} className="w-full" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Generate Handover Code
                    </Button>
                </CardContent>
            );
        case 'HANDOVER_PENDING':
            return (
                <CardContent className="flex flex-col items-center gap-4">
                    <p className="text-muted-foreground text-center">Share this code with the borrower to hand over the item.</p>
                    <div className="p-4 border-2 border-dashed rounded-lg w-full text-center">
                        <p className="text-sm text-muted-foreground">Handover Code</p>
                        <p className="text-5xl font-bold tracking-widest text-primary">{handoverCode}</p>
                    </div>
                    <p className="text-muted-foreground text-center mt-4">Waiting for borrower to verify...</p>
                </CardContent>
            );
        case 'ACTIVE':
            return (
                 <CardContent className="flex flex-col items-center gap-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <h3 className="font-semibold text-lg">Handover Complete</h3>
                    <p className="text-muted-foreground">The item is now with the borrower. Waiting for them to initiate the return.</p>
                </CardContent>
            );
        case 'RETURN_PENDING':
             return (
                <CardContent className="w-full space-y-4">
                    <p className="text-muted-foreground text-center">The borrower wants to return the item. Enter the 4-digit code they provide.</p>
                    <Input
                        type="text"
                        placeholder="Enter return code"
                        value={returnCodeInput}
                        onChange={(e) => setReturnCodeInput(e.target.value.replace(/\D/g, ''))}
                        maxLength={4}
                        className="text-center text-lg tracking-widest"
                        disabled={isProcessing}
                    />
                    <Button onClick={verifyReturnCode} className="w-full" disabled={isProcessing || returnCodeInput.length !== 4}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify Return
                    </Button>
                </CardContent>
            );
        case 'COMPLETED':
             return (
                <CardContent className="text-center space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <h3 className="font-semibold text-lg">Transaction Completed!</h3>
                    <p className="text-muted-foreground">{transaction.karma} karma points awarded.</p>
                </CardContent>
            );
        default:
            return null;
    }
}


// --- Borrower View ---
function BorrowerView({ transaction, transactionDocRef, firestore }: { transaction: Transaction, transactionDocRef: any, firestore: any }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [handoverCodeInput, setHandoverCodeInput] = useState("");
    const [returnCode, setReturnCode] = useState<string | null>(null);
    const { toast } = useToast();

    const verifyHandoverCode = async () => {
        if (handoverCodeInput.length !== 4) {
            toast({ variant: 'destructive', title: "Invalid Code", description: "Please enter a 4-digit code." });
            return;
        }
        setIsProcessing(true);
        if (simpleHash(handoverCodeInput) === transaction.handoverCodeHash) {
            try {
                await updateDoc(transactionDocRef, {
                    handoverVerified: true,
                    status: 'ACTIVE',
                    updatedAt: serverTimestamp()
                });
                if(transaction.itemId) { // Assuming itemId is the original request ID
                    await deleteDoc(doc(firestore, 'itemRequests', transaction.itemId));
                }
                toast({ title: "Success!", description: "Handover complete. The item is yours (for now!)." });
            } catch (error) {
                console.error("Verification error:", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not complete handover." });
            }
        } else {
            toast({ variant: 'destructive', title: "Invalid Code", description: "The handover code does not match." });
        }
        setIsProcessing(false);
    };

    const generateReturnCode = async () => {
        setIsProcessing(true);
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setReturnCode(code);
        try {
            await updateDoc(transactionDocRef, {
                status: 'RETURN_PENDING',
                returnCodeHash: simpleHash(code),
                updatedAt: serverTimestamp(),
            });
            toast({ title: "Return Initiated", description: "Share the new code with the lender." });
        } catch (error) {
            console.error("generateReturnCode error:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not initiate return." });
        }
        setIsProcessing(false);
    };

    switch (transaction.status) {
        case 'CREATED':
        case 'HANDOVER_PENDING':
            if (transaction.handoverCodeHash) {
              return (
                  <CardContent className="w-full space-y-4">
                      <p className="text-muted-foreground text-center">Enter the 4-digit code from the lender to receive the item.</p>
                      <Input
                          type="text"
                          placeholder="Enter handover code"
                          value={handoverCodeInput}
                          onChange={(e) => setHandoverCodeInput(e.target.value.replace(/\D/g, ''))}
                          maxLength={4}
                          className="text-center text-lg tracking-widest"
                          disabled={isProcessing}
                      />
                      <Button onClick={verifyHandoverCode} className="w-full" disabled={isProcessing || handoverCodeInput.length !== 4}>
                          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Verify Handover
                      </Button>
                  </CardContent>
              );
            }
            return (
                 <CardContent className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Waiting for the lender to generate a handover code.</p>
                </CardContent>
            );
        case 'ACTIVE':
            return (
                <CardContent className="flex flex-col items-center gap-4">
                    <Info className="h-8 w-8 text-blue-500" />
                    <p className="text-muted-foreground text-center">Item is in your possession. Click below to initiate the return process.</p>
                    <Button onClick={generateReturnCode} className="w-full" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Initiate Return
                    </Button>
                </CardContent>
            );
        case 'RETURN_PENDING':
             return (
                <CardContent className="flex flex-col items-center gap-4">
                    <p className="text-muted-foreground text-center">Share this code with the lender to return the item.</p>
                    <div className="p-4 border-2 border-dashed rounded-lg w-full text-center">
                        <p className="text-sm text-muted-foreground">Return Code</p>
                        <p className="text-5xl font-bold tracking-widest text-primary">{returnCode}</p>
                    </div>
                    <p className="text-muted-foreground text-center mt-4">Waiting for lender to verify...</p>
                </CardContent>
            );
        case 'COMPLETED':
            return (
                <CardContent className="text-center space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
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
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const transactionDocRef = useMemoFirebase(
        () => firestore && transactionId ? doc(firestore, 'transactions', transactionId as string) : null,
        [firestore, transactionId]
    );

    const { data: transaction, isLoading } = useDoc<Transaction>(transactionDocRef);

    const handleCancelTransaction = async () => {
        if (!transactionDocRef) return;
        try {
            await updateDoc(transactionDocRef, { status: 'CANCELLED', updatedAt: serverTimestamp() });
            toast({ title: 'Transaction Cancelled' });
            router.push('/dashboard');
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not cancel transaction.' });
        }
    };

    const renderContent = () => {
        if (isLoading || isUserLoading) {
            return <div className="flex min-h-[200px] items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
        }

        if (!transaction || transaction.status === 'CANCELLED') {
            return (
                <CardContent className="text-center">
                    <Alert variant="destructive">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Transaction Not Found or Cancelled</AlertTitle>
                        <AlertDescription>This transaction may have been cancelled or does not exist.</AlertDescription>
                    </Alert>
                </CardContent>
            );
        }
        
        if (user?.uid === transaction.lenderId) {
             return <LenderView transaction={transaction} transactionDocRef={transactionDocRef} />;
        }
        
        if (user?.uid === transaction.borrowerId) {
             return <BorrowerView transaction={transaction} transactionDocRef={transactionDocRef} firestore={firestore} />;
        }
        
        // User is not part of this transaction
        return (
            <CardContent className="text-center">
                <Alert variant="destructive">
                    <ShieldX className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>You are not a participant in this transaction.</AlertDescription>
                </Alert>
            </CardContent>
        );
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
                        <KeyRound />
                        Transaction Handshake
                    </CardTitle>
                    <CardDescription>
                        For {transaction?.itemName || '...'}
                    </CardDescription>
                </CardHeader>
                {transaction && (
                    <CardContent className="flex flex-col items-center gap-6 pt-6">
                        <div className="relative w-48 h-48">
                            <Image src={transaction?.itemImageUrl || `https://picsum.photos/seed/${transactionId}/320/180`} alt={transaction?.itemName || 'Item Image'} layout="fill" objectFit="cover" className="rounded-lg" data-ai-hint="item" />
                        </div>
                    </CardContent>
                )}
                {renderContent()}
                <CardFooter className="flex flex-col gap-2">
                    {transaction?.status === 'COMPLETED' && (
                        <Button asChild variant="outline" className="w-full"><Link href="/history">View in History</Link></Button>
                    )}
                    {transaction && transaction.status !== 'COMPLETED' && transaction.status !== 'CANCELLED' && (
                        <Button variant="destructive" className="w-full" onClick={handleCancelTransaction}>
                            <ShieldX className="mr-2 h-4 w-4" />
                            Cancel Transaction
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

    