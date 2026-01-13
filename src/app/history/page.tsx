'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileX, Loader2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";

type Transaction = {
  id: string;
  itemName: string;
  lenderId: string;
  borrowerId: string;
  status: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | string;
  karma: number;
};

export default function HistoryPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    
    const lentQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'transactions'),
            where('lenderId', '==', user.uid),
            where('status', '==', 'completed')
        );
    }, [user, firestore]);

    const borrowedQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'transactions'),
            where('borrowerId', '==', user.uid),
            where('status', '==', 'completed')
        );
    }, [user, firestore]);

    const { data: lentTransactions, isLoading: isLoadingLent } = useCollection<Transaction>(lentQuery);
    const { data: borrowedTransactions, isLoading: isLoadingBorrowed } = useCollection<Transaction>(borrowedQuery);

    useEffect(() => {
        if (lentTransactions && borrowedTransactions) {
            const allTransactions = [...lentTransactions, ...borrowedTransactions];
            // Remove duplicates that might occur in rare cases
            const uniqueTransactions = allTransactions.filter(
                (tx, index, self) => index === self.findIndex(t => t.id === tx.id)
            );
            // Sort by creation date
            uniqueTransactions.sort((a, b) => {
                const dateA = new Date(typeof a.createdAt === 'string' ? a.createdAt : a.createdAt.seconds * 1000);
                const dateB = new Date(typeof b.createdAt === 'string' ? b.createdAt : b.createdAt.seconds * 1000);
                return dateB.getTime() - dateA.getTime();
            });
            setTransactions(uniqueTransactions);
        } else if (lentTransactions) {
            setTransactions(lentTransactions);
        } else if (borrowedTransactions) {
            setTransactions(borrowedTransactions);
        }

    }, [lentTransactions, borrowedTransactions]);

    const isLoading = isLoadingLent || isLoadingBorrowed;

    const getTransactionDate = (createdAt: { seconds: number; nanoseconds: number; } | string) => {
        if (!createdAt) return 'N/A';
        if (typeof createdAt === 'string') {
            return new Date(createdAt).toLocaleDateString();
        }
        return new Date(createdAt.seconds * 1000).toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Transaction History</CardTitle>
                <CardDescription>An overview of all your past rental activities.</CardDescription>
            </CardHeader>
            <CardContent>
                {transactions && transactions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Karma</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium">{tx.itemName}</TableCell>
                                    <TableCell>
                                        <Badge variant={tx.lenderId === user?.uid ? 'secondary' : 'outline'}>
                                            {tx.lenderId === user?.uid ? 'Lent' : 'Borrowed'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{getTransactionDate(tx.createdAt)}</TableCell>
                                    <TableCell className="text-right font-medium text-green-600">{tx.karma}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-center py-20 border border-dashed rounded-lg">
                        <FileX className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-2xl font-bold tracking-tight font-headline">
                            No transaction history yet
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Once you complete a transaction, it will appear here.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
