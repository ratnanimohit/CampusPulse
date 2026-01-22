'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { simpleHash } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, KeyRound, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { MapLoadError } from '@/components/map-load-error';

export type Transaction = {
  id: string;
  fulfillerId: string;
  requesterId: string;
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
  location?: { lat: number; lng: number };
};

// --- RENDER COMPONENTS ---

function LenderView({ transaction }: { transaction: Transaction }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();
  const transactionDocRef = doc(firestore, 'transactions', transaction.id);

  const generateHandoverCode = async () => {
    if (transaction.status !== 'CREATED') return;
    setIsProcessing(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      await updateDoc(transactionDocRef, {
        status: 'HANDOVER_PENDING',
        handoverCodeHash: simpleHash(code),
        updatedAt: serverTimestamp(),
      });
      setGeneratedCode(code);
      toast({
        title: 'Code Generated',
        description: 'Share this code with the requester.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    }
    setIsProcessing(false);
  };
  
  const verifyReturnCode = async () => {
    if (transaction.status !== 'RETURN_PENDING') {
      toast({ variant: 'destructive', title: 'Invalid State', description: 'Cannot verify return at this stage.' });
      return;
    }
    if (simpleHash(verificationCode) !== transaction.returnCodeHash) {
      toast({ variant: 'destructive', title: 'Invalid Return Code' });
      return;
    }
    setIsProcessing(true);
    try {
      const batch = writeBatch(firestore);

      // 1. Update the transaction status
      batch.update(transactionDocRef, {
        returnVerified: true,
        status: 'COMPLETED',
        updatedAt: serverTimestamp(),
      });

      // 2. Update lender's karma
      const lenderProfileRef = doc(firestore, 'userProfiles', transaction.fulfillerId);
      batch.update(lenderProfileRef, { karmaPoints: increment(transaction.karma) });
      
      // 3. Update requester's karma
      const requesterProfileRef = doc(firestore, 'userProfiles', transaction.requesterId);
      batch.update(requesterProfileRef, { karmaPoints: increment(transaction.karma) });

      await batch.commit();

      toast({
        title: 'Transaction Completed!',
        description: `${transaction.karma} karma awarded to both users.`,
      });
    } catch (error: any) {
      console.error("Error completing transaction:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: "Could not complete transaction. " + error.message,
      });
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

  const renderContent = () => {
    switch (transaction.status) {
      case 'CREATED':
        return (
          <CardFooter>
            <Button
              className="w-full"
              onClick={generateHandoverCode}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Handover Code
            </Button>
          </CardFooter>
        );
      case 'HANDOVER_PENDING':
        return (
          <CardContent className="text-center p-4 border-dashed border-2 rounded-lg m-6 mt-0">
            <p className="text-muted-foreground">Your handover code is:</p>
            <p className="text-4xl font-bold tracking-widest my-2">
              {generatedCode || '----'}
            </p>
            <p className="text-xs text-muted-foreground">
              Share this with the requester. Waiting for them to verify...
            </p>
          </CardContent>
        );
      case 'ACTIVE':
        return (
          <CardContent className="text-center text-muted-foreground p-6">
            Item is with the requester. Waiting for them to initiate the return
            process.
          </CardContent>
        );
      case 'RETURN_PENDING':
        return (
          <CardContent className="space-y-2 p-6">
            <p className="text-sm text-center text-muted-foreground">Requester has initiated a return. Enter their code to complete.</p>
            <Input
              type="text"
              placeholder="Enter 4-digit return code"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              maxLength={4}
              className="text-center"
            />
            <Button
              className="w-full"
              onClick={verifyReturnCode}
              disabled={isProcessing || verificationCode.length !== 4}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Return
            </Button>
          </CardContent>
        );
      default:
        return null;
    }
  };

  return (
      <>
        {renderContent()}
        {(transaction.status === 'CREATED' || transaction.status === 'HANDOVER_PENDING') && (
            <CardFooter>
                <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={handleCancel} disabled={isProcessing}>Cancel Transaction</Button>
            </CardFooter>
        )}
      </>
  );
}

function BorrowerView({ transaction }: { transaction: Transaction }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const transactionDocRef = doc(firestore, 'transactions', transaction.id);

   const verifyHandoverCode = async () => {
    if (transaction.status !== 'HANDOVER_PENDING') {
      toast({ variant: 'destructive', title: 'Invalid State', description: 'Cannot verify handover at this stage.' });
      return;
    }
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
        deleteDoc(doc(firestore, 'itemRequests', transaction.itemId)).catch(console.error);
      }
      toast({ title: 'Handover Complete!', description: 'You now have the item.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setIsProcessing(false);
  };
  
  const generateReturnCode = async () => {
    if (transaction.status !== 'ACTIVE') return;
    setIsProcessing(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      await updateDoc(transactionDocRef, {
        status: 'RETURN_PENDING',
        returnCodeHash: simpleHash(code),
        updatedAt: serverTimestamp(),
      });
      setGeneratedCode(code);
      toast({ title: 'Return Initiated', description: 'Share this code with the lender.' });
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

  const renderContent = () => {
    switch (transaction.status) {
      case 'CREATED':
        return (
            <CardContent className="text-center text-muted-foreground p-6">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              <p className="mt-2">Waiting for lender to generate handover code...</p>
            </CardContent>
          );
      case 'HANDOVER_PENDING':
        return (
          <CardContent className="space-y-2 p-6">
             <p className="text-sm text-center text-muted-foreground">Lender has generated a code. Enter it below to confirm handover.</p>
            <Input
              type="text"
              placeholder="Enter 4-digit handover code"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              maxLength={4}
              className="text-center"
            />
            <Button
              className="w-full"
              onClick={verifyHandoverCode}
              disabled={isProcessing || verificationCode.length !== 4}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Handover
            </Button>
          </CardContent>
        );
      case 'ACTIVE':
        if(generatedCode){
             return <CardContent className="text-center p-4 border-dashed border-2 rounded-lg m-6 mt-0">
                <p className="text-muted-foreground">Your return code is:</p>
                <p className="text-4xl font-bold tracking-widest my-2">{generatedCode}</p>
                <p className="text-xs text-muted-foreground">Share this with the lender to complete the return.</p>
            </CardContent>
        }
        return (
          <CardFooter>
            <Button
              className="w-full"
              onClick={generateReturnCode}
              disabled={isProcessing}
            >
               {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initiate Return & Generate Code
            </Button>
          </CardFooter>
        );
      case 'RETURN_PENDING':
         return (
            <CardContent className="text-center p-4 border-dashed border-2 rounded-lg m-6 mt-0">
              <p className="text-muted-foreground">Your return code is:</p>
              <p className="text-4xl font-bold tracking-widest my-2">{generatedCode || '----'}</p>
              <p className="text-xs text-muted-foreground">Waiting for lender to verify...</p>
            </CardContent>
        )
      default:
        return null;
    }
  };
  
  return (
      <>
        {renderContent()}
        {(transaction.status === 'CREATED' || transaction.status === 'HANDOVER_PENDING') && (
            <CardFooter>
                <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={handleCancel} disabled={isProcessing}>Cancel Transaction</Button>
            </CardFooter>
        )}
      </>
  );
}

// --- MAIN PAGE COMPONENT ---

export default function TransactionPage() {
  const { id } = useParams() as { id: string };
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  const transactionDocRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'transactions', id) : null),
    [firestore, id]
  );
  
  const {
    data: transaction,
    isLoading: isTransactionLoading,
    error,
  } = useDoc<Transaction>(transactionDocRef);

  const isLoading = isUserLoading || isTransactionLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Could not load transaction details. {error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!transaction) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>This transaction does not exist or has been cancelled.</AlertDescription>
      </Alert>
    );
  }

  if (transaction.status === 'COMPLETED' || transaction.status === 'CANCELLED') {
      return (
         <div className="flex flex-col items-center justify-center h-full gap-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-center">{transaction.status === 'COMPLETED' ? 'Transaction Complete' : 'Transaction Cancelled'}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p>This transaction is now closed.</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                </CardFooter>
            </Card>
        </div>
      )
  }

  const isFulfiller = user?.uid === transaction.fulfillerId;
  const isRequester = user?.uid === transaction.requesterId;
  const userRole = isFulfiller ? 'Lender' : isRequester ? 'Borrower' : 'Observer';

  if (!isFulfiller && !isRequester) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You are not a participant in this transaction.</AlertDescription>
      </Alert>
    );
  }
  
  const getStatusBadgeVariant = () => {
      switch (transaction.status) {
          case 'ACTIVE': return 'default';
          case 'HANDOVER_PENDING':
          case 'RETURN_PENDING': return 'secondary';
          default: return 'outline';
      }
  }

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  const mapOptions = {
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    zoomControl: false,
  };


  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-md">
        <CardHeader>
           <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
             <Image src={transaction.itemImageUrl} alt={transaction.itemName} layout="fill" objectFit="cover" data-ai-hint="item"/>
          </div>
          <CardTitle className="font-headline text-2xl">{transaction.itemName}</CardTitle>
          <div className="flex justify-between items-center text-sm">
             <Badge variant={getStatusBadgeVariant()}>{transaction.status.replace(/_/g, ' ')}</Badge>
              <div className="flex items-center gap-1 text-muted-foreground">
                <KeyRound className="h-4 w-4" />
                <span className="font-bold text-primary">{transaction.karma}</span> Karma
            </div>
          </div>
           <CardDescription>
            You are the <span className="font-semibold">{userRole}</span>.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-4">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Meeting Location
            </h3>
            <div className="h-56 w-full rounded-lg overflow-hidden border">
                {loadError ? (
                    <MapLoadError loadError={loadError} />
                ) : !isLoaded ? (
                    <div className="h-full flex items-center justify-center bg-muted">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : transaction.location ? (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={transaction.location}
                        zoom={15}
                        options={mapOptions}
                    >
                        <Marker position={transaction.location} />
                    </GoogleMap>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-muted text-center p-4">
                        <p className="text-sm text-muted-foreground">Location data not provided for this transaction.</p>
                    </div>
                )}
            </div>
        </CardContent>

        {isFulfiller && <LenderView transaction={transaction} />}
        {isRequester && <BorrowerView transaction={transaction} />}
      </Card>
    </div>
  );
}
