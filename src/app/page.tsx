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
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

const allowedEmailValidator = (email: string) => email.endsWith('@gla.ac.in') || email.endsWith('@gmail.com');

const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address.')
    .refine(allowedEmailValidator, {
      message: "Email must be a '@gla.ac.in' or '@gmail.com' address.",
    }),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

const signupSchema = z.object({
    firstName: z.string().min(1, 'First name is required.'),
    lastName: z.string().min(1, 'Last name is required.'),
    email: z
        .string()
        .email('Invalid email address.')
        .refine(allowedEmailValidator, {
          message: "Email must be a '@gla.ac.in' or '@gmail.com' address.",
        }),
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address.'),
});

// Use a discriminated union to handle all three forms
const formSchema = z.discriminatedUnion("formType", [
  loginSchema.extend({ formType: z.literal("login") }),
  signupSchema.extend({ formType: z.literal("signup") }),
  forgotPasswordSchema.extend({ formType: z.literal("forgotPassword") }),
]);

type FormValues = z.infer<typeof formSchema>;


export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formType, setFormType] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      formType: 'login',
      firstName: '',
      lastName: '',
    },
  });

  // Re-initialize form when formType changes
  useEffect(() => {
    form.reset({
      email: '',
      password: '',
      formType: formType,
      ...(formType === 'signup' ? { firstName: '', lastName: '' } : {}),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formType]);


  useEffect(() => {
    if (user && user.emailVerified) {
      router.replace('/dashboard');
    }
  }, [user, router]);


  if (isUserLoading || (user && user.emailVerified)) {
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
      case 'auth/invalid-credential':
        title = 'Login Failed';
        description = 'Invalid email or password. Please try again.';
        break;
      case 'auth/email-already-in-use':
        title = 'Sign-up Failed';
        description = 'An account with this email already exists. Please log in or verify your email.';
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

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (data.formType === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        
        if (!userCredential.user.emailVerified) {
          await auth.signOut();
          throw new Error('EMAIL_NOT_VERIFIED');
        }

        toast({
          title: 'Login Successful!',
          description: "Welcome back to CampusPulse!",
        });
      } else if (data.formType === 'signup') {
        const signupData = data as z.infer<typeof signupSchema>;
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          signupData.email,
          signupData.password
        );
        const newUser = userCredential.user;
        
        await setDoc(doc(firestore, 'userProfiles', newUser.uid), {
          id: newUser.uid,
          email: newUser.email,
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          karmaPoints: 0,
          transactionCount: 0,
          averageRating: 0,
          ratingsCount: 0,
        });

        try {
          await sendEmailVerification(newUser);
          toast({
            title: 'Account Created!',
            description: 'Please check your inbox (and spam folder) for a verification link. Once verified, you can sign in.',
            duration: 10000,
          });
          // Sign the user out so they have to verify their email before logging in.
          await auth.signOut();
        } catch (emailError) {
             console.error("Failed to send verification email:", emailError);
             toast({
                variant: 'destructive',
                title: 'Could Not Send Verification Email',
                description: 'Your account was created, but we failed to send a verification email. Please try again or contact support.',
                duration: 15000,
            });
        }
        
        setFormType('login');
        form.reset();
      } else if (data.formType === 'forgotPassword') {
        const forgotData = data as z.infer<typeof forgotPasswordSchema>;
        await sendPasswordResetEmail(auth, forgotData.email);
        toast({
            title: 'Password Reset Email Sent',
            description: 'Check your inbox for a link to reset your password.',
            duration: 10000,
        });
        setFormType('login');
        form.reset();
      }
    } catch (error) {
        if (error instanceof Error && error.message === 'EMAIL_NOT_VERIFIED') {
             toast({
                variant: 'destructive',
                title: 'Email Not Verified',
                description: 'Please check your inbox for the verification link before logging in.',
                duration: 8000,
            });
        }
        else if (error instanceof FirebaseError) {
            handleAuthError(error);
        } else {
            toast({
                variant: 'destructive',
                title: 'An unexpected error occurred.',
                description: 'Please try again later.',
            });
            console.error(error);
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
             {formType === 'login' && 'Welcome to CampusPulse'}
             {formType === 'signup' && 'Create Your Account'}
             {formType === 'forgotPassword' && 'Reset Your Password'}
          </CardTitle>
          <CardDescription>
            {formType === 'login' && 'Sign in to your account to continue.'}
            {formType === 'signup' && 'Create an account to join the community.'}
            {formType === 'forgotPassword' && "We'll send a password reset link to your email."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               {formType === 'signup' && (
                <>
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="w-1/2">
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="First Name"
                              {...field}
                              value={field.value || ''}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="w-1/2">
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Last Name"
                              {...field}
                              value={field.value || ''}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.name@gla.ac.in"
                        {...field}
                        disabled={isSubmitting}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {formType !== 'forgotPassword' && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                              disabled={isSubmitting}
                              className="pr-10"
                              value={field.value || ''}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                            disabled={isSubmitting}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              )}
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {formType === 'login' ? 'Sign In' : formType === 'signup' ? 'Sign Up' : 'Send Reset Link'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            {formType === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <Button variant="link" className="p-0" onClick={() => setFormType('signup')}>
                  Sign Up
                </Button>
                <span className="mx-2 text-muted-foreground">|</span>
                <Button variant="link" className="p-0" onClick={() => setFormType('forgotPassword')}>
                    Forgot Password?
                </Button>
              </>
            ) : formType === 'signup' ? (
              <>
                Already have an account?{' '}
                <Button variant="link" className="p-0" onClick={() => setFormType('login')}>
                  Sign In
                </Button>
              </>
            ) : (
                <>
                    Remember your password?{' '}
                    <Button variant="link" className="p-0" onClick={() => setFormType('login')}>
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
