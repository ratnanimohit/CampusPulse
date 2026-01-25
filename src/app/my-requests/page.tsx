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
import { collection, query, where, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { FileX, Loader2 } from 'lucide-react';

export type ItemRequest = {
  id: string;
  itemName: string;
  urgency: 'emergency' | 'medium' | 'normal';
  requiredBy: string;
  requesterId: string;
  createdAt?: any;
  status: 'PENDING' | 'FULFILLED';
};

export default function MyRequestsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Fetch only the current user's item requests that are still PENDING.
  const myRequestsQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, 'itemRequests'),
            where('requesterId', '==', user.uid),
            where('status', '==', 'PENDING'),
            orderBy('createdAt', 'desc')
          )
        : null,
    [user, firestore]
  );
  const { data: myRequests, isLoading: isLoadingMyRequests } = useCollection<ItemRequest>(myRequestsQuery);

  const cancelRequest = async (requestId: string) => {
    if (!firestore) return;
    // A cancelled request is simply deleted. If a transaction was created,
    // cancelling it from the transaction screen will re-open this request.
    const requestDocRef = doc(firestore, 'itemRequests', requestId);
    await deleteDoc(requestDocRef);
  };

  const isLoading = isUserLoading || isLoadingMyRequests;


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">My Pending Requests</CardTitle>
          <CardDescription>
            This list shows your requests that are waiting for a lender. Once fulfilled, they will move to your Active Transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : myRequests && myRequests.length > 0 ? (
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
                {myRequests.map(req => (
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
                            {req.status}
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
