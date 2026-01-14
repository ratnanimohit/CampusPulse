'use client';

import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, or, where } from 'firebase/firestore';
import { Loader2 } from "lucide-react";

type UserProfile = {
    karmaPoints: number;
    email: string;
    firstName: string;
    lastName: string;
};

type Transaction = {
    id: string;
    status: string;
    fulfillerId: string;
    requesterId: string;
};

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    // Fetch user profile for karma points and name
    const userProfileRef = useMemoFirebase(
        () => (user && firestore ? doc(firestore, 'userProfiles', user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);
    
    // Fetch all transactions for the user to calculate stats
    const transactionsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
        collection(firestore, 'transactions'),
        or(where('fulfillerId', '==', user.uid), where('requesterId', '==', user.uid))
        );
    }, [user, firestore]);
    const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

    const stats = useMemo(() => {
        if (!transactions || !user) {
            return { lent: 0, borrowed: 0, active: 0, total: 0 };
        }
        const lent = transactions.filter(tx => tx.status === 'COMPLETED' && tx.fulfillerId === user.uid).length;
        const borrowed = transactions.filter(tx => tx.status === 'COMPLETED' && tx.requesterId === user.uid).length;
        const activeStatuses = ['CREATED', 'HANDOVER_PENDING', 'ACTIVE', 'RETURN_PENDING'];
        const active = transactions.filter(
            (tx) =>
              (tx.fulfillerId === user.uid || tx.requesterId === user.uid) &&
              activeStatuses.includes(tx.status)
        ).length;
        const total = lent + borrowed;
        return { lent, borrowed, active, total };
    }, [transactions, user]);


    if (isUserLoading || isLoadingProfile || isLoadingTransactions || !user) {
        return (
             <div className="flex min-h-screen w-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        )
    }
    
    const getInitials = (firstName?: string, lastName?: string) => {
        if (firstName && lastName) {
            return `${firstName[0]}${lastName[0]}`;
        }
        if (firstName) {
            return firstName[0];
        }
        if (user?.displayName) {
             const names = user.displayName.split(' ');
            if (names.length > 1 && names[1]) {
                return `${names[0][0]}${names[names.length - 1][0]}`;
            }
            return user.displayName.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const displayName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : (user.displayName || user.email?.split('@')[0] || 'New User');
    const creationTime = user.metadata.creationTime 
        ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
        : 'N/A';

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                             <Avatar className="h-20 w-20 border-2 border-primary">
                                <AvatarImage src={user.photoURL || ''} alt={displayName} data-ai-hint="person avatar"/>
                                <AvatarFallback>{getInitials(userProfile?.firstName, userProfile?.lastName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-2xl font-headline">{displayName}</CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                                <CardDescription>Joined: {creationTime}</CardDescription>
                            </div>
                        </div>
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
                            <p className="text-2xl font-bold">{userProfile?.karmaPoints ?? 0}</p>
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
                            <p className="text-3xl font-bold">{stats.lent}</p>
                            <p className="text-sm text-muted-foreground">Items Lent</p>
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 bg-accent/50 rounded-lg">
                            <p className="text-3xl font-bold">{stats.borrowed}</p>
                            <p className="text-sm text-muted-foreground">Items Borrowed</p>
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 bg-accent/50 rounded-lg">
                            <p className="text-3xl font-bold">{stats.total}</p>
                            <p className="text-sm text-muted-foreground">Total Transactions</p>
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 bg-accent/50 rounded-lg">
                            <p className="text-3xl font-bold">{stats.active}</p>
                            <p className="text-sm text-muted-foreground">Active Rentals</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
