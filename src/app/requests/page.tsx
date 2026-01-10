'use client';

import { useForm, FormProvider } from 'react-hook-form';
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

const requestFormSchema = z.object({
  itemName: z.string().min(1, 'Item name is required.'),
  reason: z.string().min(1, 'Reason for request is required.'),
  urgency: z.string().min(1, 'Urgency level is required.'),
  requiredBy: z.string().min(1, 'Required by date is required.'),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function RequestsPage() {
  const { toast } = useToast();
  const methods = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      itemName: '',
      reason: '',
      urgency: '',
      requiredBy: '',
    },
  });

  function onSubmit(data: RequestFormValues) {
    console.log(data);
    toast({
      title: 'Request Submitted!',
      description: 'Your request has been successfully submitted to the community.',
    });
    methods.reset();
  }

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">
                Create a New Request
              </CardTitle>
              <CardDescription>
                Let the community know what item you need.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={methods.control}
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
                control={methods.control}
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
                control={methods.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                control={methods.control}
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
              <Button type="submit">Submit Request</Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </FormProvider>
  );
}
