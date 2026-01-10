'use client';

import { useState, useRef } from 'react';
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
import { identifyItemFromImage } from '@/ai/flows/image-to-item-identification';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

const addItemSchema = z.object({
  itemName: z.string().min(1, 'Item name is required.'),
  itemType: z.string().optional(),
  photoDataUri: z.string().optional(),
});

type AddItemFormValues = z.infer<typeof addItemSchema>;
export type NewItem = AddItemFormValues;

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: (item: NewItem) => void;
}

export function AddItemDialog({ isOpen, onOpenChange, onItemAdded }: AddItemDialogProps) {
  const { toast } = useToast();
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      itemName: '',
      itemType: '',
      photoDataUri: '',
    },
  });
  
  const resetDialog = () => {
    form.reset();
    setImagePreview(null);
    onOpenChange(false);
  };


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsIdentifying(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        setImagePreview(base64data);
        form.setValue('photoDataUri', base64data);

        try {
          const result = await identifyItemFromImage({ photoDataUri: base64data });
          if (!result.manualEntryRequired && result.itemType) {
            form.setValue('itemName', result.itemType);
            toast({
              title: 'Item Identified!',
              description: `We think this is a(n) ${result.itemType}. You can edit the name if needed.`,
            });
          } else {
             toast({
              title: 'Could not identify item',
              description: `Please enter the item name manually.`,
            });
          }
        } catch (error) {
          console.error(error);
          toast({
            variant: 'destructive',
            title: 'AI Identification Failed',
            description: 'Could not identify the item. Please enter the name manually.',
          });
        } finally {
          setIsIdentifying(false);
        }
      };
    }
  };

  const onSubmit = (data: AddItemFormValues) => {
    onItemAdded(data);
    toast({
      title: 'Item Added!',
      description: `${data.itemName} has been added to your locker.`,
    });
    resetDialog();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Item to Your Locker</DialogTitle>
          <DialogDescription>
            Upload a photo of your item and we'll try to identify it for you.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Item Photo</FormLabel>
              <FormControl>
                <div
                  className="relative flex justify-center items-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isIdentifying}
                  />
                  {isIdentifying ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p>Identifying item...</p>
                    </div>
                  ) : imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Item preview"
                      layout="fill"
                      objectFit="contain"
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <p>Click to upload an image</p>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>

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
                      disabled={isIdentifying}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => resetDialog()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isIdentifying}>
                {isIdentifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
