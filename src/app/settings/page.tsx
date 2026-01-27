'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Loader2, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

type UserProfile = {
    firstName: string;
    lastName: string;
};

export default function SettingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [isClient, setIsClient] = useState(false);

    const userProfileRef = useMemoFirebase(
        () => (user && firestore ? doc(firestore, 'userProfiles', user.uid) : null),
        [user, firestore]
    );
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

    const backgroundColors = [
        { name: 'Default', value: '147 44% 91%' },
        { name: 'Zinc', value: '240 5% 96.1%' },
        { name: 'Rose', value: '346.8 77.2% 96.3%' },
        { name: 'Blue', value: '221.2 83.2% 96.5%' },
    ];
    
    const [currentBg, setCurrentBg] = useState(backgroundColors[0].value);

    useEffect(() => {
        setIsClient(true);
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            try {
                const { name, emailNotifications, pushNotifications, backgroundColor } = JSON.parse(savedSettings);
                if (name) setName(name);
                if (emailNotifications !== undefined) setEmailNotifications(emailNotifications);
                if (pushNotifications !== undefined) setPushNotifications(pushNotifications);
                if (backgroundColor) setCurrentBg(backgroundColor);
            } catch (e) {
                // ignore parsing errors
            }
        }
    }, []);

    useEffect(() => {
        if (userProfile) {
            setName(`${userProfile.firstName} ${userProfile.lastName}`);
        }
    }, [userProfile]);

    useEffect(() => {
        if (isClient) {
            const settings = { name, emailNotifications, pushNotifications, backgroundColor: currentBg };
            localStorage.setItem('userSettings', JSON.stringify(settings));
        }
    }, [name, emailNotifications, pushNotifications, isClient, currentBg]);
    
    useEffect(() => {
      if (isClient) {
        if (theme === 'light') {
          document.documentElement.style.setProperty('--background', currentBg);
        } else {
          document.documentElement.style.removeProperty('--background');
        }
      }
    }, [isClient, theme, currentBg]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
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
        
        toast({
            title: "Settings Saved",
            description: "Your changes have been saved successfully.",
        });
        setIsSaving(false);
    };

    const handlePasswordReset = async () => {
        if (!user || !user.email) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not find your email address to send a reset link.',
            });
            return;
        }

        setIsResettingPassword(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({
                title: 'Password Reset Email Sent',
                description: 'Check your inbox for a link to reset your password.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to Send Email',
                description: error.message || 'An unexpected error occurred.',
            });
        } finally {
            setIsResettingPassword(false);
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
                <Button onClick={handleSaveChanges} disabled={isSaving || isResettingPassword}>
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
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving || isResettingPassword} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user?.email || ''} disabled />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="theme-switcher">Theme</Label>
                            <p className="text-sm text-muted-foreground">Toggle between light and dark mode.</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <Sun className="h-5 w-5" />
                           <Switch
                                id="theme-switcher"
                                checked={theme === 'dark'}
                                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                            />
                           <Moon className="h-5 w-5" />
                        </div>
                    </div>
                     <Separator/>
                     <div>
                        <Label>Background Color (Light Mode)</Label>
                        <p className="text-sm text-muted-foreground pb-2">Select a background color for the light theme.</p>
                        <div className="flex gap-2">
                            {backgroundColors.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => setCurrentBg(color.value)}
                                    disabled={theme === 'dark'}
                                    className={cn(
                                        "h-8 w-8 rounded-full border-2 transition-all",
                                        currentBg === color.value && theme === 'light' ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "border-transparent",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                    style={{ backgroundColor: `hsl(${color.value})`}}
                                    aria-label={`Set background to ${color.name}`}
                                />
                            ))}
                        </div>
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
                    <Button variant="outline" onClick={handlePasswordReset} disabled={isResettingPassword || isSaving}>
                        {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Change Password
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
