'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { getCurrentLocation, getDistance } from '@/lib/utils';
import { Loader2, User, FileX, Radar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
    location?: { lat: number; lng: number };
    photoURL?: string;
};

type ItemListing = {
    id: string;
    name: string;
    imageUrl: string;
    karma: number;
    ownerId: string;
    available: boolean;
};

type NearbyLocker = {
    owner: UserProfile;
    items: ItemListing[];
    distance: number;
};

export default function NearbyLockersPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [nearbyLockers, setNearbyLockers] = useState<NearbyLocker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const profilesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'userProfiles') : null, [firestore]);
    const { data: allProfiles, isLoading: isLoadingProfiles } = useCollection<UserProfile>(profilesQuery);

    const listingsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'itemListings') : null, [firestore]);
    const { data: allListings, isLoading: isLoadingListings } = useCollection<ItemListing>(listingsQuery);

    useEffect(() => {
        const findNearbyLockers = async () => {
            if (isLoadingProfiles || isLoadingListings) return;
            setIsLoading(true);
            setError(null);

            if (!user || !allProfiles || !allListings) {
                setIsLoading(false);
                return;
            }

            try {
                const userLocation = await getCurrentLocation();
                if (!userLocation) {
                    setError("Could not get your location. Please enable location services in your browser.");
                    setIsLoading(false);
                    return;
                }

                const nearbyUsers = allProfiles.filter(profile => {
                    if (profile.id === user.uid || !profile.location) return false;
                    const distance = getDistance(userLocation.lat, userLocation.lng, profile.location.lat, profile.location.lng);
                    return distance <= 50;
                });
                
                const lockers: NearbyLocker[] = nearbyUsers.map(owner => {
                    const items = allListings.filter(item => item.ownerId === owner.id && item.available);
                    const distance = getDistance(userLocation.lat, userLocation.lng, owner.location!.lat, owner.location!.lng);
                    return { owner, items, distance };
                }).filter(locker => locker.items.length > 0); // Only show lockers that have items

                lockers.sort((a, b) => a.distance - b.distance);

                setNearbyLockers(lockers);
            } catch (e) {
                console.error("Error finding nearby lockers:", e);
                setError("An unexpected error occurred while searching for nearby lockers.");
            } finally {
                setIsLoading(false);
            }
        };

        findNearbyLockers();
    }, [allProfiles, allListings, user, isLoadingProfiles, isLoadingListings]);
    
    const getInitials = (firstName?: string, lastName?: string) => {
        if (firstName && lastName) return `${firstName[0]}${lastName[0]}`;
        if (firstName) return firstName[0];
        return 'U';
    };

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <Radar className="h-8 w-8" />
                    Nearby Lockers
                </h1>
                <p className="text-muted-foreground">Browse items available from users within 50 meters of you.</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <Card className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-destructive shadow-sm py-20">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tight font-headline">Error</h3>
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                </Card>
            ) : nearbyLockers.length > 0 ? (
                <div className="space-y-8">
                    {nearbyLockers.map(({ owner, items, distance }) => (
                        <Card key={owner.id}>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={owner.photoURL} alt={`${owner.firstName} ${owner.lastName}`} data-ai-hint="person avatar" />
                                        <AvatarFallback>{getInitials(owner.firstName, owner.lastName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="font-headline text-xl">{owner.firstName} {owner.lastName}'s Locker</CardTitle>
                                        <CardDescription>~{Math.round(distance)} meters away</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {items.map(item => (
                                    <Card key={item.id} className="overflow-hidden">
                                        <CardHeader className="p-0">
                                            <Image
                                                alt={item.name}
                                                className="rounded-t-lg object-cover w-full aspect-video"
                                                height="180"
                                                src={item.imageUrl}
                                                width="320"
                                                data-ai-hint="item"
                                            />
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <CardTitle className="text-lg font-headline">{item.name}</CardTitle>
                                            <CardDescription>{item.karma} Karma</CardDescription>
                                        </CardContent>
                                        <CardFooter>
                                             <Button asChild className="w-full" size="sm">
                                                <Link href={`/requests?itemName=${encodeURIComponent(item.name)}`}>Request Item</Link>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-20">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <FileX className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-2xl font-bold tracking-tight font-headline">
                            No Lockers Found Nearby
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            We couldn't find any available items within 50 meters of your location.
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}
