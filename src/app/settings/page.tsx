'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type UserProfile = {
    firstName: string;
    lastName: string;
};


export default function SettingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const userProfileRef = useMemoFirebase(
        () => (user && firestore ? doc(firestore, 'userProfiles', user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);


    useEffect(() => {
        setIsClient(true);
        // Load notification settings from localStorage
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            try {
                const { emailNotifications, pushNotifications } = JSON.parse(savedSettings);
                if (emailNotifications !== undefined) setEmailNotifications(emailNotifications);
                if (pushNotifications !== undefined) setPushNotifications(pushNotifications);
            } catch (e) {
                // ignore parsing errors
            }
        }
    }, []);

    useEffect(() => {
        // Pre-fill name from Firestore profile
        if (userProfile) {
            setName(`${userProfile.firstName} ${userProfile.lastName}`);
        }
    }, [userProfile]);

    // Save notification settings to localStorage whenever they change
    useEffect(() => {
        if (isClient) {
            const settings = { emailNotifications, pushNotifications };
            localStorage.setItem('userSettings', JSON.stringify(settings));
        }
    }, [emailNotifications, pushNotifications, isClient]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        // Save Profile Info
        if (userProfileRef) {
            const nameParts = name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            try {
                await updateDoc(userProfileRef, { firstName, lastName });
            } catch(e: any) {
                 toast({
                    variant: 'destructive',
                    title: "Error Saving Profile",
                    description: e.message || "Could not update your name.",
                });
            }
        }
        
        // You could also save notification settings to Firestore here if needed

        toast({
            title: "Settings Saved",
            description: "Your changes have been saved successfully.",
        });
        setIsSaving(false);
    };

    const handleClearActiveTransactions = async () => {
        if (!firestore) return;
        setIsDeleting(true);

        try {
            // Query for all documents that are NOT completed or cancelled
            const activeStatuses = ['CREATED', 'HANDOVER_PENDING', 'ACTIVE', 'RETURN_PENDING'];
            const q = query(collection(firestore, 'transactions'), where('status', 'in', activeStatuses));
            
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ title: "No Active Transactions", description: "There's nothing to clear." });
                setIsDeleting(false);
                return;
            }

            // Use a batch to delete all found documents
            const batch = writeBatch(firestore);
            querySnapshot.forEach((document) => {
                batch.delete(doc(firestore, 'transactions', document.id));
            });

            await batch.commit();

            toast({
                title: "Success!",
                description: `${querySnapshot.size} active transaction(s) have been cleared.`,
            });
        } catch (error: any) {
            console.error("Error clearing transactions:", error);
            toast({
                variant: 'destructive',
                title: "Error Clearing Data",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsDeleting(false);
        }
    };


    if (!isClient || isLoadingProfile) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and notification settings.</p>
                </div>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Profile</CardTitle>
                    <CardDescription>Update your public profile information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user?.email || ''} disabled />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Notifications</CardTitle>
                    <CardDescription>Choose how you want to be notified.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="email-notifications">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive emails about new requests and messages.</p>
                        </div>
                        <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                    </div>
                    <Separator/>
                     <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="push-notifications">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Get push notifications on your mobile device.</p>
                        </div>
                        <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Security</CardTitle>
                    <CardDescription>Manage your password and account security.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline">Change Password</Button>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="font-headline">Data Management</CardTitle>
                    <CardDescription>Perform one-time data operations. Use with caution.</CardDescription>
                </CardHeader>
                <CardContent>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive" disabled={isDeleting}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Clear All Active Transactions
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete all transactions that are not currently 'COMPLETED' or 'CANCELLED' from the database.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearActiveTransactions}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <p className="text-sm text-muted-foreground mt-2">
                        Use this if your active transaction count appears stuck or incorrect. This will clear any stuck transactions.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
