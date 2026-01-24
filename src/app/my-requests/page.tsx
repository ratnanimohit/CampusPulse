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
import { collection, query, where, doc, deleteDoc, getDocs } from 'firebase/firestore';
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

// Simplified transaction type for this page's purpose
export type Transaction = {
  id: string;
  itemId: string;
  status: string;
};

export default function MyRequestsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // We only fetch requests that have NOT been converted to a transaction yet.
  // This simplifies the page logic and removes race conditions.
  const requestsQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(collection(firestore, 'itemRequests'), where('requesterId', '==', user.uid), orderBy('createdAt', 'desc'))
        : null,
    [user, firestore]
  );
  const { data: requests, isLoading: isLoadingRequests } = useCollection<ItemRequest>(requestsQuery);
  
  // Find which requests have been picked up and are now transactions
  const requestIds = useMemo(() => requests?.map(r => r.id) || [], [requests]);

  const transactionsQuery = useMemoFirebase(() => {
      if (!firestore || requestIds.length === 0) return null;
      return query(
        collection(firestore, 'transactions'), 
        where('itemId', 'in', requestIds),
        where('status', '!=', 'CANCELLED')
      );
    }, [firestore, requestIds]
  );
  
  const { data: associatedTransactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);
  
  // Only show requests that are still "pending" (i.e., have no active transaction)
  const pendingRequests = useMemo(() => {
    if (!requests) return [];
    const transactionItemIds = new Set(associatedTransactions?.map(t => t.itemId));
    return requests.filter(r => !transactionItemIds.has(r.id));
  }, [requests, associatedTransactions]);


  const cancelRequest = async (requestId: string) => {
    if (!firestore) return;
    const requestDocRef = doc(firestore, 'itemRequests', requestId);
    await deleteDoc(requestDocRef);

    // Also cancel any associated transaction that might have been created
     const transactionSnapshot = await getDocs(query(collection(firestore, 'transactions'), where('itemId', '==', requestId)));
     if (!transactionSnapshot.empty) {
        const transactionDoc = transactionSnapshot.docs[0];
        await deleteDoc(transactionDoc.ref);
     }
  };
  
  const isLoading = isUserLoading || isLoadingRequests || (requestIds.length > 0 && isLoadingTransactions);
  

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">My Pending Requests</CardTitle>
          <CardDescription>
            An overview of your requests that are waiting to be fulfilled. Active rentals can be found on the 'Active Transactions' page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingRequests && pendingRequests.length > 0 ? (
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
                {pendingRequests.map(req => (
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
                        <Badge variant="outline">
                            Pending
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                           <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelRequest(req.id)}
                            >
                              Cancel
                            </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center py-20 border border-dashed rounded-lg">
              <FileX className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight font-headline">
                You have no pending requests
              </h3>
              <p className="text-sm text-muted-foreground">
                Create a new request to see it here, or check 'Active Transactions' for ongoing rentals.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
