'use client';

import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, or, and } from "firebase/firestore";
import { TransactionCard, type Transaction } from "@/components/transaction-card";
import { Loader2, FileX } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function TransactionsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(
        () => 
            (user && firestore) ? query(
                collection(firestore, 'transactions'),
                and(
                    or(where('lenderId', '==', user.uid), where('borrowerId', '==', user.uid)),
                    where('status', '!=', 'COMPLETED'),
                    where('status', '!=', 'CANCELLED')
                )
            ) : null,
        [user, firestore]
    );

    const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

    const isLoading = isUserLoading || isLoadingTransactions;

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Active Transactions</CardTitle>
                    <CardDescription>
                        All your ongoing handovers and returns. Complete the necessary steps to proceed.
                    </CardDescription>
                </CardHeader>
            </Card>
            
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            ) : transactions && transactions.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {transactions.map(tx => (
                        <TransactionCard key={tx.id} transaction={tx} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-20">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <FileX className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-2xl font-bold tracking-tight font-headline">No active transactions</h3>
                        <p className="text-sm text-muted-foreground">
                            When you lend or borrow an item, it will appear here.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
