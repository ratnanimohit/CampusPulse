'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const requestFormSchema = z.object({
  itemName: z.string().min(1, 'Item name is required.'),
  reason: z.string().min(1, 'Reason for request is required.'),
  urgency: z.string().min(1, 'Urgency level is required.'),
  requiredBy: z.string().min(1, 'Required by date is required.'),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      error => {
        console.warn(`Geolocation error: ${error.message}`);
        resolve(null); // On error, resolve with null
      }
    );
  });
};

export default function RequestsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      itemName: '',
      reason: '',
      urgency: '',
      requiredBy: '',
    },
  });

  async function onSubmit(data: RequestFormValues) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a request.',
      });
      return;
    }
    
    const location = await getCurrentLocation();

    const itemRequestsCol = collection(firestore, 'itemRequests');
    const newRequestRef = doc(itemRequestsCol);
    
    const requestData = {
        ...data,
        id: newRequestRef.id,
        requesterId: user.uid,
        createdAt: serverTimestamp(),
        ...(location && { location })
    };

    await setDoc(newRequestRef, requestData);

    toast({
      title: 'Request Submitted!',
      description: location ? 'Your request has been successfully submitted to the community.' : 'Your request was submitted without location data.',
    });
    form.reset();
    router.push('/my-requests');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Create a New Request
            </CardTitle>
            <CardDescription>
              Let the community know what item you need. We'll ask for your location to help lenders find you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Electric Iron, Graphic Calculator"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Request</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe why you need this item..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="normal">
                        Normal Need (Standard distance)
                      </SelectItem>
                      <SelectItem value="medium">
                        Medium Need (Extended distance)
                      </SelectItem>
                      <SelectItem value="emergency">
                        Emergency Need (Maximum distance)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requiredBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required By</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!user}>
              Submit Request
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
