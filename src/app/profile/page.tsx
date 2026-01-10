'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase";
import { Edit } from "lucide-react";

export default function ProfilePage() {
    const user = useUser();

    if (user === undefined) {
        return <div>Loading...</div>
    }

    if (!user) {
        return <div>Please sign in to view your profile.</div>
    }
    
    const getInitials = (name: string | null | undefined) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`;
        }
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                             <Avatar className="h-20 w-20 border-2 border-primary">
                                <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} data-ai-hint="person avatar"/>
                                <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl font-headline">{user.displayName || 'New User'}</CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                                <CardDescription>Joined: {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric'}) : 'N/A'}</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4"/>
                            <span className="sr-only">Edit Profile</span>
                        </Button>
                    </div>
                </CardHeader>
            </Card>
             <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Karma Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <p className="text-sm text-muted-foreground">Total Karma Points</p>
                            <p className="text-2xl font-bold">0</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Lender Rating</p>
                            <p className="text-2xl font-bold">N/A</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Borrower Rating</p>
                            <p className="text-2xl font-bold">N/A</p>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-headline">Activity Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center justify-center p-4 bg-accent/50 rounded-lg">
                            <p className="text-3xl font-bold">0</p>
                            <p className="text-sm text-muted-foreground">Items Lent</p>
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 bg-accent/50 rounded-lg">
                            <p className="text-3xl font-bold">0</p>
                            <p className="text-sm text-muted-foreground">Items Borrowed</p>
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 bg-accent/50 rounded-lg">
                            <p className="text-3xl font-bold">0</p>
                            <p className="text-sm text-muted-foreground">Total Transactions</p>
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 bg-accent/50 rounded-lg">
                            <p className="text-3xl font-bold">0</p>
                            <p className="text-sm text-muted-foreground">Active Rentals</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
