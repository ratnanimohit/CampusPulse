import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const transactions = [
  { id: 1, item: "Electric Iron", user: "Ravi Kumar", type: "Lent", status: "Returned", karma: "+5", date: "2023-10-15" },
  { id: 2, item: "Chemistry Notes", user: "Priya Sharma", type: "Borrowed", status: "Active", karma: "N/A", date: "2023-10-18" },
  { id: 3, item: "Graphic Calculator", user: "Amit Singh", type: "Lent", status: "Returned", karma: "+4", date: "2023-10-12" },
  { id: 4, item: "USB-C Cable", user: "Sunita Devi", type: "Borrowed", status: "Returned", karma: "+3", date: "2023-10-10" },
  { id: 5, item: "Reading Lamp", user: "Vikram Batra", type: "Lent", status: "Returned", karma: "+5", date: "2023-10-05" },
  { id: 6, item: "Textbook", user: "Anjali Mehta", type: "Borrowed", status: "Returned", karma: "+4", date: "2023-10-02" },
];


export default function HistoryPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Transaction History</CardTitle>
                <CardDescription>An overview of all your past rental activities.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    );
}
