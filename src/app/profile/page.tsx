'use client';

import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, or, where, orderBy } from 'firebase/firestore';
import { Loader2, Star } from "lucide-react";
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

type UserProfile = {
    karmaPoints: number;
    email: string;
    firstName: string;
    lastName: string;
    averageRating?: number;
    ratingsCount?: number;
};

type Transaction = {
    id: string;
    status: string;
    fulfillerId: string;
    requesterId: string;
};

type Feedback = {
    id: string;
    rating: number;
    comment?: string;
    createdAt: { seconds: number; nanoseconds: number } | any;
    raterFirstName: string;
    raterLastName: string;
    raterPhotoURL: string;
};


const StarRatingDisplay = ({ rating, count }: { rating: number; count: number }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <div className="flex items-center">
                    {[...Array(fullStars)].map((_, i) => (
                        <Star key={`full-${i}`} className="h-5 w-5 text-primary fill-primary" />
                    ))}
                    {halfStar && <Star key="half" className="h-5 w-5 text-primary" style={{ clipPath: 'inset(0 50% 0 0)' }} fill="currentColor" />}
                    {[...Array(emptyStars)].map((_, i) => (
                        <Star key={`empty-${i}`} className="h-5 w-5 text-muted-foreground/50 fill-muted-foreground/20" />
                    ))}
                </div>
                <p className="text-2xl font-bold">{rating.toFixed(1)}</p>
            </div>
            <p className="text-sm text-muted-foreground -mt-1">{count} ratings</p>
        </div>
    );
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
    
    const feedbackQuery = useMemoFirebase(
        () => user && firestore ? query(
            collection(firestore, 'feedback'),
            where('ratedUserId', '==', user.uid)
            // No longer ordering by 'createdAt' here to avoid needing a composite index
        ) : null,
        [user, firestore]
    );
    const { data: unsortedFeedbacks, isLoading: isLoadingFeedbacks } = useCollection<Feedback>(feedbackQuery);

    const feedbacks = useMemo(() => {
        if (!unsortedFeedbacks) return [];
        // Sort on the client side and take the last 5
        return [...unsortedFeedbacks].sort((a, b) => {
            const timeA = a.createdAt?.seconds ?? 0;
            const timeB = b.createdAt?.seconds ?? 0;
            return timeB - timeA;
        }).slice(0, 5);
    }, [unsortedFeedbacks]);


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
                        <CardTitle className="font-headline">Reputation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div>
                            <p className="text-sm font-medium text-muted-foreground">Overall Rating</p>
                            {(userProfile?.ratingsCount ?? 0) > 0 ? (
                                <StarRatingDisplay rating={userProfile?.averageRating ?? 0} count={userProfile?.ratingsCount ?? 0} />
                            ) : (
                                <p className="text-lg font-bold text-muted-foreground/80 pt-2">No ratings yet</p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Karma Points</p>
                            <p className="text-2xl font-bold">{userProfile?.karmaPoints ?? 0}</p>
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
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Feedback</CardTitle>
                    <CardDescription>What other users are saying about your transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingFeedbacks ? (
                        <div className="flex items-center justify-center p-10">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : feedbacks && feedbacks.length > 0 ? (
                        <div className="space-y-4">
                            {feedbacks.map((feedback, index) => (
                                <React.Fragment key={feedback.id}>
                                    <div className="flex gap-4">
                                        <Avatar>
                                            <AvatarImage src={feedback.raterPhotoURL} alt={`${feedback.raterFirstName} ${feedback.raterLastName}`} data-ai-hint="person avatar" />
                                            <AvatarFallback>{`${feedback.raterFirstName?.[0] || 'A'}${feedback.raterLastName?.[0] || ''}`}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">{feedback.raterFirstName} {feedback.raterLastName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(feedback.createdAt.seconds * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-0.5 my-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={cn(
                                                            "h-4 w-4",
                                                            i < feedback.rating ? "text-primary fill-primary" : "text-muted-foreground/30"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            {feedback.comment && <p className="text-sm text-muted-foreground mt-1">{feedback.comment}</p>}
                                        </div>
                                    </div>
                                    {index < feedbacks.length - 1 && <Separator />}
                                </React.Fragment>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-center py-10 border border-dashed rounded-lg">
                             <p className="text-sm text-muted-foreground">
                                No feedback received yet.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
