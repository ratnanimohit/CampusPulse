'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileX } from "lucide-react";

const transactions: any[] = [
  // Dummy data removed
];


export default function HistoryPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Transaction History</CardTitle>
                <CardDescription>An overview of all your past rental activities.</CardDescription>
            </CardHeader>
            <CardContent>
                {transactions.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Karma</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-medium">{tx.item}</TableCell>
                                <TableCell>{tx.user}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.type === 'Lent' ? 'secondary' : 'outline'}>{tx.type}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{tx.status}</Badge>
                                </TableCell>
                                <TableCell>{tx.date}</TableCell>
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
                            Once you borrow or lend items, your history will appear here.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
