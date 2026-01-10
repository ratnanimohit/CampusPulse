'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FileX } from "lucide-react";
import Link from 'next/link';
import { useUser } from "@/firebase";
import { useAtom } from 'jotai';
import { requestsAtom } from '@/lib/requests-store';
import { useToast } from "@/hooks/use-toast";

const transactions: any[] = [];

export default function Dashboard() {
  const user = useUser();
  const [userName, setUserName] = useState('');
  const [requests, setRequests] = useAtom(requestsAtom);
  const { toast } = useToast();

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    const defaultName = user?.displayName || 'Student';

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
  }, [user]);

  const fulfillRequest = (requestId: string) => {
    setRequests((prevRequests) => prevRequests.filter((req) => req.id !== requestId));
    toast({
      title: 'Request Fulfilled!',
      description: 'Thank you for helping a member of your community!',
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">Here's what's happening on campus today.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/requests">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/locker">
              Add Item to Locker
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Karma Points</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"></path><path d="M12 16.5A4.5 4.5 0 1 0 7.5 12 4.5 4.5 0 0 0 12 16.5z"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No activity yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Lent</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No items lent yet</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Borrowed</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="m12 8-4 4 4 4"></path><path d="M16 8v8"></path><path d="M8 12h12"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No items borrowed yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transactions</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No active transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Transactions</CardTitle>
            <CardDescription>An overview of your recent rental activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="hidden sm:table-cell">User</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Karma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.item}</TableCell>
                      <TableCell className="hidden sm:table-cell">{tx.user}</TableCell>
                      <TableCell className="hidden md:table-cell">
                          <Badge variant={tx.type === 'Lent' ? 'secondary' : 'outline'}>{tx.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{tx.karma}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-center py-10 border border-dashed rounded-lg">
                    <FileX className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No recent transactions.</p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <div className="grid gap-2">
              <CardTitle className="font-headline">Community Requests</CardTitle>
              <CardDescription>
                Items being requested by others on campus.
              </CardDescription>
            </div>
          </CardHeader>
           <CardContent>
            {requests.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Urgency</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.slice(0, 3).map((req) => (
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
                                      {req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="outline" onClick={() => fulfillRequest(req.id)}>Fulfill</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                 <div className="flex flex-col items-center justify-center gap-2 text-center py-10 border border-dashed rounded-lg">
                    <FileX className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No active community requests.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
