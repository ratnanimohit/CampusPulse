'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Authentication service is not available.');
      return;
    }
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      toast({
        title: isSignUp ? 'Account Created!' : 'Signed In!',
        description: isSignUp
          ? 'Welcome! You have been successfully signed up.'
          : 'Welcome back!',
      });
      router.push('/');
    } catch (err: any) {
      let friendlyMessage = 'An unexpected error occurred.';
      switch (err.code) {
        case 'auth/user-not-found':
          friendlyMessage = 'No account found with this email. Please sign up.';
          break;
        case 'auth/wrong-password':
          friendlyMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/email-already-in-use':
          friendlyMessage = 'This email is already in use. Please sign in.';
          break;
        case 'auth/weak-password':
          friendlyMessage = 'The password must be at least 6 characters long.';
          break;
        case 'auth/invalid-email':
          friendlyMessage = 'Please enter a valid email address.';
          break;
        default:
          friendlyMessage = err.message;
          break;
      }
      setError(friendlyMessage);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: friendlyMessage,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <form onSubmit={handleAuthAction}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Enter your email and password to get started.'
                : 'Sign in to access your dashboard.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@gla.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={!auth}>
               <Mail className="mr-2 h-4 w-4" />
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
