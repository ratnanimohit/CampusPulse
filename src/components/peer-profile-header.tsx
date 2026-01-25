'use client';

import { useMemo } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type UserProfile = {
    firstName: string;
    lastName: string;
    email: string;
    averageRating?: number;
    ratingsCount?: number;
    karmaPoints?: number;
    photoURL?: string;
};

interface PeerProfileHeaderProps {
    peerId: string;
    role: 'Lender' | 'Borrower';
}

export function PeerProfileHeader({ peerId, role }: PeerProfileHeaderProps) {
    const firestore = useFirestore();

    const peerProfileRef = useMemoFirebase(
        () => (firestore && peerId ? doc(firestore, 'userProfiles', peerId) : null),
        [firestore, peerId]
    );

    const { data: peerProfile, isLoading } = useDoc<UserProfile>(peerProfileRef);

    if (isLoading) {
        return (
            <div className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    }

    if (!peerProfile) {
        return (
            <div className="flex items-center justify-center p-4 border rounded-lg text-muted-foreground">
                Could not load peer profile.
            </div>
        );
    }

    const getInitials = (firstName?: string, lastName?: string) => {
        if (firstName && lastName) return `${firstName[0]}${lastName[0]}`;
        if (firstName) return firstName[0];
        return 'P'; // for Peer
    };

    const displayName = `${peerProfile.firstName} ${peerProfile.lastName}`;
    const isVerified = peerProfile.email?.endsWith('@gla.ac.in');

    return (
        <Link href={`/profile/${peerId}`} className="block w-full">
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                <Avatar className="h-12 w-12 border-2 border-primary">
                     <AvatarImage src={peerProfile.photoURL} alt={displayName} data-ai-hint="person avatar"/>
                    <AvatarFallback>{getInitials(peerProfile.firstName, peerProfile.lastName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                         <p className="text-sm font-semibold text-muted-foreground">{role}</p>
                         {isVerified && <Badge variant="secondary">Verified Student</Badge>}
                    </div>
                    <p className="font-bold text-lg">{displayName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-primary fill-primary" />
                            <span className="font-semibold text-foreground">{peerProfile.averageRating?.toFixed(1) ?? 'N/A'} ({peerProfile.ratingsCount ?? 0})</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Flame className="h-4 w-4 text-chart-5" />
                            <span className="font-semibold text-foreground">{peerProfile.karmaPoints ?? 0}</span>
                            <span>Karma</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
