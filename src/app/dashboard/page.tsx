'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
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
import { PlusCircle, FileX, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  query,
  where,
  setDoc,
  doc,
  serverTimestamp,
  or,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

type ItemRequest = {
  id: string;
  itemName: string;
  urgency: 'emergency' | 'medium' | 'normal';
  requesterId: string;
};

type UserProfile = {
    karmaPoints: number;
};

type Transaction = {
    id: string;
    itemName: string;
    status: string;
    fulfillerId: string;
    requesterId: string;
    karma: number;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    } | any;
};


// A simple delay function
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


export default function Dashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [userName, setUserName] = useState('');
  const [isFulfilling, setIsFulfilling] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch community requests
  const requestsQuery = useMemoFirebase(
    () => firestore && user ? query(
        collection(firestore, 'itemRequests'), 
        where('requesterId', '!=', user.uid)
    ) : null,
    [firestore, user]
  );
  const { data: requests, isLoading: isLoadingRequests } = useCollection<ItemRequest>(requestsQuery);

  // Fetch user profile for karma points
   const userProfileRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'userProfiles', user.uid) : null),
    [user, firestore]
  );
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  // Fetch ALL transactions for the user to calculate stats accurately
   const allTransactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'transactions'),
      or(where('fulfillerId', '==', user.uid), where('requesterId', '==', user.uid)),
    );
  }, [user, firestore]);
  const { data: allTransactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(allTransactionsQuery);

  const stats = useMemo(() => {
    if (!allTransactions || !user) {
      return { lent: 0, borrowed: 0, active: 0 };
    }
    const lent = allTransactions.filter(tx => tx.status === 'COMPLETED' && tx.fulfillerId === user.uid).length;
    const borrowed = allTransactions.filter(tx => tx.status === 'COMPLETED' && tx.requesterId === user.uid).length;
    const activeStatuses = ['CREATED', 'HANDOVER_PENDING', 'ACTIVE', 'RETURN_PENDING'];
    const active = allTransactions.filter(
        (tx) =>
          (tx.fulfillerId === user.uid || tx.requesterId === user.uid) &&
          activeStatuses.includes(tx.status)
      ).length;
    return { lent, borrowed, active };
  }, [allTransactions, user]);
  
  // Create a separate memoized array for the recent transactions table
  const recentTransactions = useMemo(() => {
      if (!allTransactions) return [];
      // Sort by date and take the first 5
      return [...allTransactions].sort((a, b) => {
          const dateA = a.createdAt?.seconds ?? 0;
          const dateB = b.createdAt?.seconds ?? 0;
          return dateB - dateA;
      }).slice(0, 5);
  }, [allTransactions]);


  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const savedSettings = localStorage.getItem('userSettings');
      const defaultName = user?.displayName || user?.email?.split('@')[0] || 'Student';

      if (savedSettings) {
        try {
          const { name } = JSON.parse(savedSettings);
          setUserName(name || defaultName);
        } catch (e) {
          setUserName(defaultName);
        }
      } else {
        setUserName(defaultName);
      }
    }
  }, [user, isClient]);

  const fulfillRequest = async (request: ItemRequest) => {
    if (!firestore || !user) return;
    setIsFulfilling(request.id);

    try {
      const transactionDocRef = doc(collection(firestore, 'transactions'));

      const transactionData = {
        id: transactionDocRef.id,
        fulfillerId: user.uid,
        requesterId: request.requesterId,
        itemId: request.id,
        itemName: request.itemName,
        itemImageUrl: `https://picsum.photos/seed/${request.itemName.replace(/\s/g, '')}/320/180`,
        karma: 10, // Example karma
        status: 'CREATED',
        handoverCodeHash: null,
        handoverVerified: false,
        returnCodeHash: null,
        returnVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(transactionDocRef, transactionData);
      console.log("Transaction created with ID:", transactionDocRef.id);

      await delay(300);
  
      toast({
        title: 'Request Accepted!',
        description: `Redirecting to the transaction page.`,
      });
      
      router.push(`/transaction/${transactionDocRef.id}`);
  
    } catch (error) {
      console.error("Error fulfilling request: ", error);
      toast({
        variant: 'destructive',
        title: 'Fulfillment Failed',
        description: 'Could not start the transaction process.',
      });
       setIsFulfilling(null);
    } 
  };

  if (!isClient) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening on campus today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/requests">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/locker">Add Item to Locker</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Karma Points</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"></path>
              <path d="M12 16.5A4.5 4.5 0 1 0 7.5 12 4.5 4.5 0 0 0 12 16.5z"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile?.karmaPoints ?? 0}</div>
            <p className="text-xs text-muted-foreground">Your community score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Lent</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lent}</div>
             <p className="text-xs text-muted-foreground">Completed rentals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Items Borrowed
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="m12 8-4 4 4 4"></path>
              <path d="M16 8v8"></path>
              <path d="M8 12h12"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.borrowed}</div>
            <p className="text-xs text-muted-foreground">
              Completed rentals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Transactions
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Ongoing rentals
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Transactions</CardTitle>
            <CardDescription>
              An overview of your recent rental activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
                 <div className="flex items-center justify-center p-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentTransactions && recentTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Karma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.itemName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.fulfillerId === user?.uid ? 'secondary' : 'outline'}
                        >
                          {tx.fulfillerId === user?.uid ? 'Lent' : 'Borrowed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.status.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {tx.karma}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-center py-10 border border-dashed rounded-lg">
                <FileX className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No recent transactions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="grid gap-2">
              <CardTitle className="font-headline">
                Community Requests
              </CardTitle>
              <CardDescription>
                Items being requested by others on campus.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <div className="flex items-center justify-center p-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : requests && requests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.slice(0, 3).map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {req.itemName}
                      </TableCell>
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
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fulfillRequest(req)}
                          disabled={user?.uid === req.requesterId || isFulfilling !== null}
                        >
                           {isFulfilling === req.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Fulfill
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-center py-10 border border-dashed rounded-lg">
                <FileX className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No active community requests.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
