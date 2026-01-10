'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
    const { user } = useUser();
    const { toast } = useToast();
    
    // State for user profile information
    const [name, setName] = useState('');
    
    // State for notification preferences
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Load settings from localStorage on initial render
    useEffect(() => {
        if (isClient) {
            const savedSettings = localStorage.getItem('userSettings');
            const defaultName = user?.displayName || '';
            if (savedSettings) {
                try {
                    const { name, emailNotifications, pushNotifications } = JSON.parse(savedSettings);
                    setName(name || defaultName);
                    if (emailNotifications !== undefined) setEmailNotifications(emailNotifications);
                    if (pushNotifications !== undefined) setPushNotifications(pushNotifications);
                } catch (e) {
                    setName(defaultName);
                }
            } else if (user?.displayName) {
                setName(user.displayName);
            }
        }
    }, [user, isClient]);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        if (isClient) {
            const settings = { name, emailNotifications, pushNotifications };
            localStorage.setItem('userSettings', JSON.stringify(settings));
        }
    }, [name, emailNotifications, pushNotifications, isClient]);

    const handleSaveChanges = () => {
        toast({
            title: "Settings Saved",
            description: "Your changes have been saved successfully.",
        });
    };

    if (!isClient) {
        return <div>Loading...</div>; // Or a skeleton loader
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and notification settings.</p>
                </div>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Profile</CardTitle>
                    <CardDescription>Update your public profile information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
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
