'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

const glaEmailValidator = (email: string) => email.endsWith('@gla.ac.in');

const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address.')
    .refine(glaEmailValidator, {
      message: "Email must be a '@gla.ac.in' address.",
    }),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formType, setFormType] = useState<'login' | 'signup'>('login');

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);


  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  const handleAuthError = (error: FirebaseError) => {
    let title = 'An error occurred';
    let description = error.message;

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        title = 'Login Failed';
        description = 'Invalid email or password. Please try again.';
        break;
      case 'auth/email-already-in-use':
        title = 'Sign-up Failed';
        description = 'An account with this email already exists. Please log in.';
        break;
      case 'auth/invalid-email':
         title = 'Invalid Email';
         description = 'Please enter a valid email address.';
         break;
      case 'auth/weak-password':
          title = 'Weak Password';
          description = 'The password must be at least 6 characters long.';
          break;
      default:
        // Keep generic for other Firebase errors
        break;
    }
     toast({
        variant: 'destructive',
        title,
        description,
      });
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      if (formType === 'login') {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: 'Login Successful!',
          description: "Welcome back to Campus Collab!",
        });
        router.push('/dashboard');
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );
        const newUser = userCredential.user;
        const [firstName, lastName] = newUser.email?.split('@')[0].split('.') || ['New', 'User'];

        // Create user profile in Firestore
        await setDoc(doc(firestore, 'userProfiles', newUser.uid), {
          id: newUser.uid,
          email: newUser.email,
          firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          lastName: lastName ? lastName.charAt(0).toUpperCase() + lastName.slice(1) : '',
          karmaPoints: 0,
          transactionCount: 0,
        });

        toast({
          title: 'Account Created!',
          description: 'Welcome to Campus Collab! You can now log in.',
        });
        setFormType('login'); // Switch to login view after successful signup
        form.reset();
      }
    } catch (error) {
        if (error instanceof FirebaseError) {
            handleAuthError(error);
        } else {
            toast({
                variant: 'destructive',
                title: 'An unexpected error occurred.',
                description: 'Please try again later.',
            });
        }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">
            Welcome to Campus Collab
          </CardTitle>
          <CardDescription>
            {formType === 'login'
              ? 'Sign in to your account to continue.'
              : 'Create an account to join the community.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GLA Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.name@gla.ac.in"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {formType === 'login' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {formType === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => {
                    setFormType('signup');
                    form.reset();
                  }}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => {
                    setFormType('login');
                    form.reset();
                  }}
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
