'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
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

type Transaction = {
  id: string;
  requesterId: string;
  fulfillerId: string | null;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  karma: number;
  status: 'requested' | 'awaiting_verification' | 'completed' | 'cancelled';
  verificationCode: string | null;
  codeVerified: boolean;
  createdAt: string;
  completedAt: string | null;
  originalRequestId: string;
};

// --- Fulfiller (Lender) View ---
function FulfillerView({ transaction, transactionDocRef, firestore, user }: { transaction: Transaction, transactionDocRef: any, firestore: any, user: any }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleFulfill = async () => {
        setIsProcessing(true);
        const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
        try {
            await updateDoc(transactionDocRef, {
                status: 'awaiting_verification',
                verificationCode: generateCode(),
                fulfillerId: user.uid
            });
            toast({ title: "Code Generated", description: "Share the code with the requester." });
        } catch (error) {
            console.error("Fulfill error:", error);
            toast({ variant: 'destructive', title: "Error", description: "Could not generate verification code." });
        }
        setIsProcessing(false);
    };

    switch (transaction.status) {
        case 'requested':
            return (
                <CardContent className="flex flex-col items-center gap-4">
                    <Info className="h-8 w-8 text-blue-500" />
                    <p className="text-muted-foreground text-center">Press the button below to generate a verification code for the requester.</p>
                    <Button onClick={handleFulfill} className="w-full" disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Fulfill Request
                    </Button>
                </CardContent>
            );
        case 'awaiting_verification':
            return (
                <CardContent className="flex flex-col items-center gap-4">
                    <p className="text-muted-foreground text-center">Share this code with the requester to hand over the item.</p>
                    <div className="p-4 border-2 border-dashed rounded-lg w-full text-center">
                        <p className="text-sm text-muted-foreground">Verification Code</p>
                        <p className="text-5xl font-bold tracking-widest text-primary">{transaction.verificationCode}</p>
                    </div>
                    <p className="text-muted-foreground text-center mt-4">Waiting for requester to verify...</p>
                </CardContent>
            );
        case 'completed':
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


// --- Requester (Borrower) View ---
function RequesterView({ transaction, transactionDocRef, firestore }: { transaction: Transaction, transactionDocRef: any, firestore: any }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [inputCode, setInputCode] = useState("");
    const { toast } = useToast();

    const verifyCode = async () => {
        if (inputCode.length !== 6) {
            toast({ variant: 'destructive', title: "Invalid Code", description: "Please enter a 6-digit code." });
            return;
        }
        setIsProcessing(true);
        if (inputCode === transaction.verificationCode) {
            try {
                await updateDoc(transactionDocRef, {
                    codeVerified: true,
                    status: 'completed',
                    completedAt: new Date().toISOString()
                });
                if(transaction.originalRequestId) {
                    await deleteDoc(doc(firestore, 'itemRequests', transaction.originalRequestId));
                }
                toast({ title: "Success!", description: "Transaction completed." });
            } catch (error) {
                console.error("Verification error:", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not complete transaction." });
            }
        } else {
            toast({ variant: 'destructive', title: "Invalid Code", description: "The code does not match." });
            setInputCode("");
        }
        setIsProcessing(false);
    };

    switch (transaction.status) {
        case 'requested':
            return (
                <CardContent className="flex flex-col items-center gap-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Waiting for a lender to fulfill your request.</p>
                </CardContent>
            );
        case 'awaiting_verification':
            return (
                <CardContent className="w-full space-y-4">
                    <p className="text-muted-foreground text-center">Enter the 6-digit code from the lender to receive the item.</p>
                    <Input
                        type="text"
                        placeholder="Enter verification code"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                        disabled={isProcessing}
                    />
                    <Button onClick={verifyCode} className="w-full" disabled={isProcessing || inputCode.length !== 6}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Verify Code
                    </Button>
                </CardContent>
            );
        case 'completed':
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
            await updateDoc(transactionDocRef, { status: 'cancelled' });
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

        if (!transaction || transaction.status === 'cancelled') {
            return (
                <CardContent className="text-center">
                    <Alert variant="destructive">
                        <Info className="h-4 w-4" />
                        <AlertTitle>Transaction Not Found</AlertTitle>
                        <AlertDescription>This transaction may have been cancelled or does not exist.</AlertDescription>
                    </Alert>
                </CardContent>
            );
        }
        
        // This is the CRITICAL logic check. Are we the requester or a potential fulfiller?
        if (user?.uid === transaction.requesterId) {
             return <RequesterView transaction={transaction} transactionDocRef={transactionDocRef} firestore={firestore} />;
        }
        // If not the requester, we are the fulfiller (or a user who should not be here)
        // The fulfillerId might be null initially
        else if (user?.uid === transaction.fulfillerId || transaction.fulfillerId === null) {
             return <FulfillerView transaction={transaction} transactionDocRef={transactionDocRef} firestore={firestore} user={user} />;
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
                    {transaction?.status === 'completed' && (
                        <Button asChild variant="outline" className="w-full"><Link href="/history">View in History</Link></Button>
                    )}
                    {transaction && transaction.status !== 'completed' && transaction.status !== 'cancelled' && (
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
