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
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

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
                const { name, emailNotifications, pushNotifications } = JSON.parse(savedSettings);
                if (name) setName(name);
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
            const settings = { name, emailNotifications, pushNotifications };
            localStorage.setItem('userSettings', JSON.stringify(settings));
        }
    }, [name, emailNotifications, pushNotifications, isClient]);

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
        </div>
    );
}
