'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import type { Item } from '@/app/locker/page';

const editItemSchema = z.object({
  id: z.string(),
  itemName: z.string().min(1, 'Item name is required.'),
});

export type EditedItem = z.infer<typeof editItemSchema>;

interface EditItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (item: EditedItem) => void;
  item: Item;
}

export function EditItemDialog({ isOpen, onOpenChange, onItemUpdated, item }: EditItemDialogProps) {
  const { toast } = useToast();

  const form = useForm<EditedItem>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
        id: item.id,
        itemName: item.description,
    },
  });

  useEffect(() => {
    if (item) {
        form.reset({
            id: item.id,
            itemName: item.description,
        });
    }
  }, [item, form])

  const onSubmit = (data: EditedItem) => {
    onItemUpdated(data);
    toast({
      title: 'Item Updated!',
      description: `Your item has been successfully updated.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update the details for your item.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Electric Iron"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
