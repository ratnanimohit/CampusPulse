'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, ArrowUpRight } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images.json';
import { useUser } from "@/firebase";

const transactions = [
  { id: 1, item: "Electric Iron", user: "Ravi Kumar", type: "Lent", status: "Returned", karma: "+5" },
  { id: 2, item: "Chemistry Notes", user: "Priya Sharma", type: "Borrowed", status: "Active", karma: "N/A" },
  { id: 3, item: "Graphic Calculator", user: "Amit Singh", type: "Lent", status: "Returned", karma: "+4" },
  { id: 4, item: "USB-C Cable", user: "Sunita Devi", type: "Borrowed", status: "Due", karma: "N/A" },
];

const availableItems = placeholderImages.slice(0, 4);

export default function Dashboard() {
  const user = useUser();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}!</h1>
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
            <div className="text-2xl font-bold">1,250</div>
            <p className="text-xs text-muted-foreground">+50 points this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Lent</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 this month</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Borrowed</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="m12 8-4 4 4 4"></path><path d="M16 8v8"></path><path d="M8 12h12"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+1 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transactions</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">1 borrowed, 2 lent</p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center">
             <div className="grid gap-2">
              <CardTitle className="font-headline">Available Nearby</CardTitle>
              <CardDescription>
                Items available for you to borrow from others.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/requests">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
             {availableItems.map((item) => (
              <div key={item.id} className="group relative">
                <Image
                  alt={item.description}
                  className="rounded-lg object-cover w-full aspect-square transition-transform group-hover:scale-105"
                  height="200"
                  src={item.imageUrl}
                  width="200"
                  data-ai-hint={item.imageHint}
                />
                <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/50 p-2 text-white">
                  <h3 className="text-sm font-semibold">{item.description}</h3>
                  <p className="text-xs">10 Karma / day</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
