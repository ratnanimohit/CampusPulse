'use client';

import { useMemo } from 'react';
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
import { collection, query, where, doc, deleteDoc, getDocs, orderBy } from 'firebase/firestore';
import { FileX, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
  itemId: string; // This is the ItemRequest ID
  status: string;
};

export default function MyRequestsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // 1. Fetch ALL item requests, ordered by date.
  const allRequestsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'itemRequests'), orderBy('createdAt', 'desc'))
        : null,
    [firestore]
  );
  const { data: allRequests, isLoading: isLoadingAllRequests } = useCollection<ItemRequest>(allRequestsQuery);

  // 2. Filter on the client-side to get only the current user's requests.
  const myRequests = useMemo(() => {
      if (!allRequests || !user) return [];
      return allRequests.filter(req => req.requesterId === user.uid);
  }, [allRequests, user]);

  // Find transactions associated with the user's requests
  const requestIds = useMemo(() => myRequests?.map(r => r.id) || [], [myRequests]);

  const transactionsQuery = useMemoFirebase(() => {
      if (!firestore || requestIds.length === 0) return null;
      // This query finds any transaction that was created from one of our requests.
      return query(
        collection(firestore, 'transactions'),
        where('itemId', 'in', requestIds),
        where('status', '!=', 'CANCELLED')
      );
    }, [firestore, requestIds]
  );

  const { data: associatedTransactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

  // Combine request and transaction data to create a unified view.
  const displayRequests = useMemo(() => {
    if (!myRequests) return [];

    const transactionMap = new Map(associatedTransactions?.map(t => [t.itemId, t]));

    return myRequests.map(req => {
        const transaction = transactionMap.get(req.id);
        if (transaction) {
            // If a transaction exists, use its status
            return {
                ...req,
                transactionId: transaction.id,
                status: transaction.status.replace(/_/g, ' ')
            };
        } else {
            // Otherwise, the request is still pending
            return {
                ...req,
                status: 'Pending'
            };
        }
    });
  }, [myRequests, associatedTransactions]);


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

  const isLoading = isUserLoading || isLoadingAllRequests || (requestIds.length > 0 && isLoadingTransactions);


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">My Requests</CardTitle>
          <CardDescription>
            An overview of your requests, both pending and active. Active rentals can be managed on their transaction pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayRequests && displayRequests.length > 0 ? (
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
                {displayRequests.map(req => (
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
                        <Badge variant={req.status === 'Pending' ? 'outline' : 'default'} className="capitalize">
                            {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                           {req.status === 'Pending' ? (
                             <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelRequest(req.id)}
                              >
                                Cancel
                              </Button>
                           ) : (
                             <Button asChild size="sm" variant="outline">
                                <Link href={`/transaction/${(req as any).transactionId}`}>
                                    View Transaction
                                </Link>
                             </Button>
                           )}
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
                You have no active requests
              </h3>
              <p className="text-sm text-muted-foreground">
                Create a new request to see it here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
