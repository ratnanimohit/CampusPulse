'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const user = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleDemoAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Authentication service is not available.');
      return;
    }

    if (!email.endsWith('@gla.ac.in')) {
      const message = 'Only @gla.ac.in emails are allowed.';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Invalid Email',
        description: message,
      });
      return;
    }

    setLoading(true);
    setError(null);
    const demoPassword = 'defaultPassword123'; // Static password for demo purposes

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.length > 0) {
        // User exists, sign them in
        await signInWithEmailAndPassword(auth, email, demoPassword);
        toast({
          title: 'Signed In!',
          description: 'Welcome back!',
        });
      } else {
        // User does not exist, create a new account
        await createUserWithEmailAndPassword(auth, email, demoPassword);
        toast({
          title: 'Account Created!',
          description: 'Welcome! A demo account has been created for you.',
        });
      }
      router.push('/');
    } catch (err: any) {
      let friendlyMessage = 'An unexpected error occurred. Please try again.';
      // Handle cases where password for an existing account is not the demo one
      if (err.code === 'auth/wrong-password') {
          friendlyMessage = "This email exists with a different password. This demo mode only works for accounts created within it.";
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }

      setError(friendlyMessage);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: friendlyMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <form onSubmit={handleDemoAuth}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">
              Campus Collab Access
            </CardTitle>
            <CardDescription>
              Enter your GLA University email to sign in or sign up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">University Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your-name@gla.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={!auth || loading}>
               <Mail className="mr-2 h-4 w-4" />
              {loading ? 'Authenticating...' : 'Proceed to Dashboard'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
