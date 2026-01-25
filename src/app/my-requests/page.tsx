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

  // 1. Fetch only the current user's item requests, ordered by date.
  const myRequestsQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, 'itemRequests'),
            where('requesterId', '==', user.uid),
            orderBy('createdAt', 'desc')
          )
        : null,
    [user, firestore]
  );
  const { data: myRequests, isLoading: isLoadingMyRequests } = useCollection<ItemRequest>(myRequestsQuery);

  // 2. Fetch all transactions where the current user is the requester.
  const transactionsQuery = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return query(
        collection(firestore, 'transactions'),
        where('requesterId', '==', user.uid)
      );
    }, [user, firestore]
  );
  const { data: associatedTransactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);
  
  // 3. On the client, determine which requests are fulfilled and should not be displayed.
  const displayRequests = useMemo(() => {
    if (!myRequests) return [];
    // If transactions haven't loaded yet, show all requests briefly to avoid layout shift, 
    // they will be filtered out once transactions load.
    if (!associatedTransactions) return myRequests;

    // A request is considered "fulfilled" if a transaction for it exists and is NOT cancelled.
    const fulfilledRequestIds = new Set(
        associatedTransactions
            .filter(t => t.status !== 'CANCELLED')
            .map(t => t.itemId)
    );
    
    return myRequests.filter(req => !fulfilledRequestIds.has(req.id));
    
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

  const isLoading = isUserLoading || isLoadingMyRequests || isLoadingTransactions;


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">My Requests</CardTitle>
          <CardDescription>
            An overview of your item requests that are waiting for a lender.
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
                Create a new request to see it here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
