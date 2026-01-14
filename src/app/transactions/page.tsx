'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, or, and } from 'firebase/firestore';
import { TransactionCard } from '@/components/transaction-card';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileX, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Transaction } from '@/components/transaction-card';

export default function TransactionsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    // This query now explicitly looks for statuses that represent an active transaction.
    const activeStatuses = ['CREATED', 'HANDOVER_PENDING', 'ACTIVE', 'RETURN_PENDING'];

    return query(
      collection(firestore, 'transactions'),
      and(
        or(
          where('fulfillerId', '==', user.uid),
          where('requesterId', '==', user.uid)
        ),
        where('status', 'in', activeStatuses)
      )
    );
  }, [user, firestore]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);
  
  const pageIsLoading = isUserLoading || isLoading;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Active Transactions</h1>
        <p className="text-muted-foreground">
          Manage your ongoing item exchanges here.
        </p>
      </div>

      {pageIsLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
        </div>
      ) : transactions && transactions.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {transactions.map(tx => (
            <Link href={`/transaction/${tx.id}`} key={tx.id} className="flex">
              <TransactionCard transaction={tx} />
            </Link>
          ))}
        </div>
      ) : (
        <Card className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-20">
            <div className="flex flex-col items-center gap-2 text-center">
                <FileX className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight font-headline">
                    You have no active transactions
                </h3>
                <p className="text-sm text-muted-foreground">
                    Active rentals will appear here once you fulfill or create a request.
                </p>
            </div>
        </Card>
      )}
    </div>
  );
}
