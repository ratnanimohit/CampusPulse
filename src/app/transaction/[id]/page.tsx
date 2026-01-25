'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import {
  doc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  collection,
  query,
  where
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
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import { MapLoadError } from '@/components/map-load-error';
import { FeedbackForm } from '@/components/feedback-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/chat-interface";
import { PeerProfileHeader } from '@/components/peer-profile-header';


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
  handoverCode?: string | null;
  handoverCodeHash: string | null;
  handoverVerified: boolean;
  returnCode?: string | null;
  returnCodeHash: string | null;
  returnVerified: boolean;
  location?: { lat: number; lng: number };
};

type UserProfile = {
  firstName: string;
  lastName: string;
};


const TransactionMap = ({ location }: { location: { lat: number; lng: number } }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

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

  if (loadError) {
    return <MapLoadError loadError={loadError} />;
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={location}
      zoom={15}
      options={mapOptions}
    >
      <Marker position={location} />
    </GoogleMap>
  );
};


// --- RENDER COMPONENTS ---

function LenderView({
  transaction,
  isProcessing,
  setIsProcessing,
}: {
  transaction: Transaction;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}) {
  const [verificationCode, setVerificationCode] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();
  const transactionDocRef = doc(firestore, 'transactions', transaction.id);

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

      // 1. Update the transaction status to COMPLETED
      batch.update(transactionDocRef, {
        returnVerified: true,
        status: 'COMPLETED',
        updatedAt: serverTimestamp(),
      });

      // 2. FIX: Delete the original item request now that the transaction is complete
      if (transaction.itemId) {
          const requestDocRef = doc(firestore, 'itemRequests', transaction.itemId);
          batch.delete(requestDocRef);
      }

      await batch.commit();

      toast({
        title: 'Transaction Completed!',
        description: `Please leave feedback to award karma points.`,
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
      case 'HANDOVER_PENDING':
        if (transaction.handoverCode) {
          return (
            <CardContent className="text-center p-4 border-dashed border-2 rounded-lg m-6 mt-0">
              <p className="text-muted-foreground">Your handover code is:</p>
              <p className="text-4xl font-bold tracking-widest my-2">
                {transaction.handoverCode}
              </p>
              <p className="text-xs text-muted-foreground">
                Share this with the requester. Waiting for them to verify...
              </p>
            </CardContent>
          );
        }
        return (
          <CardContent className="text-center p-6">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Waiting for handover code...</p>
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
          <CardContent className="space-y-4 p-6">
             <div className="text-center">
                <p className="font-semibold">Confirm Item Return</p>
                <p className="text-sm text-muted-foreground">The borrower has a 4-digit return code. Enter it below to confirm you have the item back.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="return-code" className="sr-only">Return Code</Label>
              <Input
                id="return-code"
                type="text"
                placeholder="Enter 4-digit return code"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                maxLength={4}
                className="text-center"
              />
            </div>
            <Button
              className="w-full"
              onClick={verifyReturnCode}
              disabled={isProcessing || verificationCode.length !== 4}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Item Returned
            </Button>
          </CardContent>
        );
      default:
        return null;
    }
  };

  const canCancel = transaction.status === 'CREATED' || transaction.status === 'HANDOVER_PENDING';

  return (
      <>
        {renderContent()}
        {canCancel && (
            <CardFooter>
                <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={handleCancel} disabled={isProcessing}>Cancel Transaction</Button>
            </CardFooter>
        )}
      </>
  );
}

function BorrowerView({
  transaction,
  isProcessing,
  setIsProcessing,
}: {
  transaction: Transaction;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
}) {
  const [verificationCode, setVerificationCode] = useState('');
  const { toast } = useToast();
  const firestore = useFirestore();
  const transactionDocRef = doc(firestore, 'transactions', transaction.id);

  const verifyHandoverCode = async () => {
    if (transaction.status !== 'HANDOVER_PENDING') return;
    if (simpleHash(verificationCode) !== transaction.handoverCodeHash) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'The handover code is incorrect. Please try again.',
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await updateDoc(transactionDocRef, {
        handoverVerified: true,
        status: 'ACTIVE',
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Handover Verified!',
        description: 'The transaction is now active. You can initiate a return when ready.',
      });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const generateReturnCode = () => {
    if (transaction.status !== 'ACTIVE') return;
    
    setIsProcessing(true);
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    updateDoc(transactionDocRef, {
      status: 'RETURN_PENDING',
      returnCode: code,
      returnCodeHash: simpleHash(code),
      updatedAt: serverTimestamp(),
    })
      .then(() => {
        toast({ title: 'Return Initiated', description: 'Share this code with the lender.' });
      })
      .catch((error: any) => {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      })
      .finally(() => {
        setIsProcessing(false);
      });
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
      case 'HANDOVER_PENDING':
        return (
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
                <p className="font-semibold">Confirm Handover</p>
                <p className="text-sm text-muted-foreground">The lender has a 4-digit code. Enter it below to confirm you have the item.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="handover-code" className="sr-only">Handover Code</Label>
                <Input
                  id="handover-code"
                  type="text"
                  placeholder="Enter 4-digit code"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  maxLength={4}
                  className="text-center"
                  disabled={isProcessing}
                />
            </div>
            <Button
              className="w-full"
              onClick={verifyHandoverCode}
              disabled={isProcessing || verificationCode.length !== 4}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify You Have the Item
            </Button>
          </CardContent>
        );
      case 'ACTIVE':
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
        if (transaction.returnCode) {
          return (
            <CardContent className="text-center p-4 border-dashed border-2 rounded-lg m-6 mt-0">
              <p className="text-muted-foreground">Your return code is:</p>
              <p className="text-4xl font-bold tracking-widest my-2">{transaction.returnCode}</p>
              <p className="text-xs text-muted-foreground">Share this with the lender. Waiting for them to verify...</p>
            </CardContent>
          );
        }
        return (
            <CardContent className="text-center text-muted-foreground p-6">
                <div className="space-y-2">
                    <p className="font-semibold">Return Initiated</p>
                    <p className="text-sm">
                        Waiting for the lender to verify the return.
                    </p>
                </div>
            </CardContent>
        )
      default:
         return (
            <CardContent className="text-center text-muted-foreground p-6">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              <p className="mt-2 font-semibold">Waiting for lender...</p>
              <p className="text-sm">The lender will generate a 4-digit code for the handover.</p>
            </CardContent>
          );
    }
  };

  const canCancel = transaction.status === 'CREATED' || transaction.status === 'HANDOVER_PENDING';
  
  return (
      <>
        {renderContent()}
        {canCancel && (
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

  const [isProcessing, setIsProcessing] = useState(false);
  const hasApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== 'PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE';

  const transactionDocRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'transactions', id) : null),
    [firestore, id]
  );
  
  const {
    data: transaction,
    isLoading: isTransactionLoading,
    error,
  } = useDoc<Transaction>(transactionDocRef);
  
  // Fetch lender profile
  const lenderProfileRef = useMemoFirebase(
    () => (firestore && transaction ? doc(firestore, 'userProfiles', transaction.fulfillerId) : null),
    [firestore, transaction]
  );
  const { data: lenderProfile, isLoading: isLoadingLender } = useDoc<UserProfile>(lenderProfileRef);


  // Fetch requester profile
  const requesterProfileRef = useMemoFirebase(
    () => (firestore && transaction ? doc(firestore, 'userProfiles', transaction.requesterId) : null),
    [firestore, transaction]
  );
  const { data: requesterProfile, isLoading: isLoadingRequester } = useDoc<UserProfile>(requesterProfileRef);

  const participants = useMemo(() => {
    if (!lenderProfile || !requesterProfile || !transaction) return [];
    return [
        {
            id: transaction.fulfillerId,
            name: `${lenderProfile.firstName} ${lenderProfile.lastName}`,
            avatar: '',
        },
        {
            id: transaction.requesterId,
            name: `${requesterProfile.firstName} ${requesterProfile.lastName}`,
            avatar: '',
        },
    ];
  }, [lenderProfile, requesterProfile, transaction]);

  const feedbackQuery = useMemoFirebase(
    () => (firestore && id && user) ? query(
      collection(firestore, 'feedback'),
      where('transactionId', '==', id),
      where('raterId', '==', user.uid)
    ) : null,
    [firestore, id, user]
  );
  const { data: userFeedback, isLoading: isLoadingFeedback } = useCollection(feedbackQuery);

  const isLoading = isUserLoading || isTransactionLoading || isLoadingFeedback || isLoadingLender || isLoadingRequester;

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

  const isFulfiller = user?.uid === transaction.fulfillerId;
  const isRequester = user?.uid === transaction.requesterId;
  const userRole = isFulfiller ? 'Lender' : isRequester ? 'Borrower' : 'Observer';
  const peerId = isFulfiller ? transaction.requesterId : transaction.fulfillerId;
  const peerRole = isFulfiller ? 'Borrower' : 'Lender';

  if (transaction.status === 'COMPLETED' || transaction.status === 'CANCELLED') {
      const hasGivenFeedback = userFeedback && userFeedback.length > 0;
      const ratedUserId = isFulfiller ? transaction.requesterId : transaction.fulfillerId;

      return (
         <div className="flex flex-col items-center justify-center pt-10">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-center">{transaction.status === 'COMPLETED' ? 'Transaction Complete' : 'Transaction Cancelled'}</CardTitle>
                </CardHeader>
                <CardContent>
                    {transaction.status === 'COMPLETED' && user && (
                       hasGivenFeedback ? (
                           <div className="text-center">
                               <p className="text-muted-foreground">Thank you for your feedback!</p>
                           </div>
                       ) : (
                           <FeedbackForm 
                                transactionId={transaction.id}
                                ratedUserId={ratedUserId}
                                raterId={user.uid}
                                baseKarma={transaction.karma}
                           />
                       )
                    )}
                     {transaction.status === 'CANCELLED' && (
                        <p className="text-center text-muted-foreground">This transaction was cancelled.</p>
                     )}
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
                </CardFooter>
            </Card>
        </div>
      )
  }

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

  return (
    <div className="flex justify-center items-start pt-10">
        <Card className="w-full max-w-md overflow-hidden">
            <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-2 rounded-none">
                    <TabsTrigger value="details" className="rounded-none">Details</TabsTrigger>
                    <TabsTrigger value="chat" className="rounded-none">Chat</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
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
                    </CardHeader>

                    <div className="px-6 pb-2">
                        <PeerProfileHeader peerId={peerId} role={peerRole} />
                    </div>
                    
                    {isFulfiller && (
                      <LenderView
                        transaction={transaction}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                      />
                    )}
                    {isRequester && (
                      <BorrowerView
                        transaction={transaction}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                      />
                    )}

                    <CardContent className="pb-4">
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            Meeting Location
                        </h3>
                        <div className="h-56 w-full rounded-lg overflow-hidden border">
                           {!hasApiKey ? (
                                <div className="h-full flex flex-col items-center justify-center bg-muted text-center p-4">
                                    <p className="text-sm text-muted-foreground">Google Maps API Key is not configured. Map functionality is disabled.</p>
                                </div>
                            ) : transaction.location ? (
                                <TransactionMap location={transaction.location} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-muted text-center p-4">
                                    <p className="text-sm text-muted-foreground">Location data not provided for this transaction.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>

                </TabsContent>
                <TabsContent value="chat" className="m-0">
                    <div className="h-[calc(80vh-100px)] md:h-[700px] border-t">
                        {participants.length > 0 ? (
                           <ChatInterface transactionId={transaction.id} participants={participants} />
                        ): (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    </div>
  );
}
