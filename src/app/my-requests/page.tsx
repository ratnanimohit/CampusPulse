'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp, deleteDoc, orderBy } from 'firebase/firestore';
import { FileX, Loader2 } from 'lucide-react';
import { VerifyHandoverDialog } from '@/components/verify-handover-dialog';

export type ItemRequest = {
  id: string;
  itemName: string;
  urgency: 'emergency' | 'medium' | 'normal';
  requiredBy: string;
  requesterId: string;
  createdAt?: any;
};

export type Transaction = {
  id: string;
  itemId: string;
  status: string;
  handoverCodeHash: string;
};

export default function MyRequestsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [verifyingTransaction, setVerifyingTransaction] = useState<Transaction | null>(null);

  const requestsQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(collection(firestore, 'itemRequests'), where('requesterId', '==', user.uid), orderBy('createdAt', 'desc'))
        : null,
    [user, firestore]
  );
  const { data: requests, isLoading: isLoadingRequests } = useCollection<ItemRequest>(requestsQuery);

  const requestIds = useMemo(() => requests?.map(r => r.id) || [], [requests]);

  const transactionsQuery = useMemoFirebase(
    () => {
      if (!firestore || requestIds.length === 0) return null;
      return query(
        collection(firestore, 'transactions'), 
        where('itemId', 'in', requestIds)
      );
    }, 
    [firestore, requestIds]
  );
  
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const cancelRequest = async (requestId: string, transactionId?: string) => {
    if (!firestore) return;
    // Always delete the original request
    const requestDocRef = doc(firestore, 'itemRequests', requestId);
    await deleteDoc(requestDocRef);

    // If a transaction has started, cancel it instead of just deleting the request
    if (transactionId) {
      const transactionDocRef = doc(firestore, 'transactions', transactionId);
      await updateDoc(transactionDocRef, {
        status: 'CANCELLED',
        updatedAt: serverTimestamp(),
      });
    }
  };
  
  const getTransactionForRequest = (requestId: string) => {
    return transactions?.find(t => t.itemId === requestId);
  }
  
  const isLoading = isUserLoading || isLoadingRequests || (requestIds.length > 0 && isLoadingTransactions);
  

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">My Requests</CardTitle>
          <CardDescription>
            An overview of all your pending item requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : requests && requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(req => {
                  const transaction = getTransactionForRequest(req.id);
                  const status = transaction ? transaction.status : 'Pending';
                  const isCancellable = status === 'Pending' || status === 'CREATED';

                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.itemName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            req.urgency === 'emergency'
                              ? 'destructive'
                              : req.urgency === 'medium'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {req.urgency.charAt(0).toUpperCase() +
                            req.urgency.slice(1)}
                        </Badge>
                      </TableCell>
                       <TableCell>
                        <Badge variant={transaction ? "secondary" : "outline"}>
                            {status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {transaction?.status === 'HANDOVER_PENDING' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setVerifyingTransaction(transaction)}
                            >
                                Verify Handover
                            </Button>
                        )}
                        {isCancellable && (
                           <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelRequest(req.id, transaction?.id)}
                            >
                              Cancel
                            </Button>
                        )}
                         {transaction && !isCancellable && transaction.status !== 'HANDOVER_PENDING' && (
                             <span className="text-sm text-muted-foreground px-3">In Progress</span>
                         )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center py-20 border border-dashed rounded-lg">
              <FileX className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight font-headline">
                You have no active requests
              </h3>
              <p className="text-sm text-muted-foreground">
                Create a new request to see it here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {verifyingTransaction && (
          <VerifyHandoverDialog 
            isOpen={!!verifyingTransaction}
            onOpenChange={(isOpen) => {
                if(!isOpen) {
                    setVerifyingTransaction(null);
                }
            }}
            transaction={verifyingTransaction}
          />
      )}
    </>
  );
}
