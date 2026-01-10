'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, DocumentData, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, ArrowLeft, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { QrScannerDialog } from '@/components/qr-scanner';

type Transaction = {
  id: string;
  lenderId: string;
  borrowerId: string;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  karma: number;
  status: 'pending-start' | 'active' | 'pending-end' | 'completed';
  qrCodeStart?: string;
  qrCodeEnd?: string;
  startTime?: any;
};

export default function TransactionPage() {
  const { id: transactionId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const transactionDocRef = useMemoFirebase(
    () =>
      firestore && transactionId
        ? doc(firestore, 'transactions', transactionId as string)
        : null,
    [firestore, transactionId]
  );

  const {
    data: transaction,
    isLoading,
    error,
  } = useDoc<Transaction>(transactionDocRef);
  
  const [qrCodeDataUri, setQrCodeDataUri] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const isLender = user?.uid === transaction?.lenderId;
  const isBorrower = user?.uid === transaction?.borrowerId;

  // Dynamically import the QR code library on the client
  useEffect(() => {
    if (typeof window !== 'undefined' && transaction) {
      let qrContent = '';
      if (transaction.status === 'pending-start' && isLender) {
        qrContent = transaction.qrCodeStart || '';
      } else if (transaction.status === 'pending-end' && isBorrower) {
        qrContent = transaction.qrCodeEnd || '';
      }

      if (qrContent) {
        import('qrcode')
          .then(QRCode => {
            QRCode.toDataURL(qrContent, { width: 300 }, (err, url) => {
              if (err) {
                console.error('QR Code generation failed:', err);
                return;
              }
              setQrCodeDataUri(url);
            });
          })
          .catch(err => console.error('Failed to load qrcode library', err));
      } else {
        setQrCodeDataUri('');
      }
    }
  }, [transaction, isLender, isBorrower]);


  const handleScanResult = (scannedData: string | null) => {
    if (!scannedData || !transaction || !transactionDocRef) return;

    if (isBorrower && transaction.status === 'pending-start' && scannedData === transaction.qrCodeStart) {
        setDocumentNonBlocking(transactionDocRef, {
            status: 'active',
            startTime: serverTimestamp(),
        }, { merge: true });

        toast({
            title: 'Rental Started!',
            description: `You are now borrowing ${transaction.itemName}.`,
        });
    } else if (isLender && transaction.status === 'pending-end' && scannedData === transaction.qrCodeEnd) {
        setDocumentNonBlocking(transactionDocRef, {
            status: 'completed',
            actualEndTime: serverTimestamp(),
        }, { merge: true });

        // Future: Award Karma points here
        
        toast({
            title: 'Rental Completed!',
            description: `The item has been successfully returned.`,
        });
    } else {
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: 'The scanned QR code is incorrect for this transaction.',
      });
    }
     setIsScannerOpen(false);
  };
  
  const handleEndRental = () => {
    if (!transaction || !transactionDocRef || !isBorrower) return;
    
    // Generate a new QR code for ending the transaction
    const qrEndContent = `${transaction.lenderId}-${transaction.borrowerId}-${transaction.itemId}-${Date.now()}-END`;

    setDocumentNonBlocking(transactionDocRef, {
      status: 'pending-end',
      qrCodeEnd: qrEndContent,
    }, { merge: true });
    
     toast({
        title: 'Ready to Return',
        description: 'Show the new QR code to the lender to complete the return.',
      });
  }


  if (isLoading) {
    return <div>Loading transaction...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!transaction) {
    return <div>Transaction not found.</div>;
  }


  const getStatusDescription = () => {
    switch (transaction.status) {
      case 'pending-start':
        return isLender 
          ? 'Show this QR code to the borrower to start the rental.' 
          : 'Scan the lender\'s QR code to start the rental.';
      case 'active':
        return `Rental in progress. Enjoy the ${transaction.itemName}!`;
      case 'pending-end':
         return isBorrower
          ? 'Show this QR code to the lender to complete the return.'
          : 'Scan the borrower\'s QR code to complete the return.';
      case 'completed':
        return 'This transaction has been completed.';
      default:
        return 'Transaction status is unknown.';
    }
  }


  return (
    <div className="flex flex-col gap-4 items-center">
        <QrScannerDialog 
            isOpen={isScannerOpen}
            onOpenChange={setIsScannerOpen}
            onScan={handleScanResult}
            title="Scan QR Code"
            description="Point your camera at the QR code to proceed."
        />
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className='flex justify-start items-center mb-4'>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard"><ArrowLeft/></Link>
            </Button>
          </div>
          <CardTitle className="font-headline text-2xl">
            Transaction Details
          </CardTitle>
          <CardDescription>{getStatusDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="relative w-48 h-48">
            <Image
              src={transaction.itemImageUrl}
              alt={transaction.itemName}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
          <h2 className="text-xl font-semibold">{transaction.itemName}</h2>

          {qrCodeDataUri ? (
            <div className="flex flex-col items-center gap-4 p-4 border border-dashed rounded-lg">
                <Image src={qrCodeDataUri} alt="QR Code" width={250} height={250} />
                <p className="text-sm text-muted-foreground text-center">
                  {transaction.status === 'pending-start' && isLender && 'Borrower must scan to begin.'}
                  {transaction.status === 'pending-end' && isBorrower && 'Lender must scan to end.'}
                </p>
            </div>
          ) : null}

          {(transaction.status !== 'active' && transaction.status !== 'completed' && !qrCodeDataUri) && (
              <div className="p-4 text-center">
                  <p className="text-muted-foreground">Waiting for other user to generate QR code...</p>
              </div>
          )}


          {transaction.status === 'active' && (
             <div className="flex flex-col items-center gap-4 p-6 bg-green-50 border-green-200 border rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="font-medium text-green-700">Rental is Active</p>
            </div>
          )}
          
           {transaction.status === 'completed' && (
             <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 border-gray-200 border rounded-lg">
                <CheckCircle className="h-12 w-12 text-gray-500" />
                <p className="font-medium text-gray-700">Rental Completed</p>
            </div>
          )}

          {isBorrower && transaction.status === 'pending-start' && (
             <Button onClick={() => setIsScannerOpen(true)}>
                <QrCode className="mr-2 h-4 w-4"/>
                Scan to Start
             </Button>
          )}

          {isBorrower && transaction.status === 'active' && (
            <Button onClick={handleEndRental}>
              End Rental & Generate Return QR
            </Button>
          )}

          {isLender && transaction.status === 'pending-end' && (
            <Button onClick={() => setIsScannerOpen(true)}>
              <QrCode className="mr-2 h-4 w-4"/>
              Scan to End
            </Button>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
