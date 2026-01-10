'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import Image from 'next/image';
import { placeholderImages as defaultItems } from '@/lib/placeholder-images.json';
import { AddItemDialog, type NewItem } from '@/components/add-item-dialog';
import { EditItemDialog, type EditedItem } from '@/components/edit-item-dialog';

export type Item = {
    id: string;
    description: string;
    imageUrl: string;
    imageHint: string;
    karma: number;
};

const initialItems = defaultItems.map(item => ({ ...item, karma: 10 }));

export default function LockerPage() {
    const [userItems, setUserItems] = useState<Item[]>(initialItems);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    const handleItemAdded = (newItem: NewItem) => {
        const item: Item = {
            id: `item-${Date.now()}`,
            description: newItem.itemName,
            imageUrl: newItem.photoDataUri || 'https://picsum.photos/seed/placeholder/320/180',
            imageHint: 'new item',
            karma: newItem.karma || 10,
        }
        setUserItems(prevItems => [item, ...prevItems]);
    };

    const handleItemUpdated = (updatedItem: EditedItem) => {
        setUserItems(prevItems => 
            prevItems.map(item => 
                item.id === updatedItem.id ? { ...item, description: updatedItem.itemName, karma: updatedItem.karma } : item
            )
        );
        setEditingItem(null);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Locker</h1>
                    <p className="text-muted-foreground">Items you have listed for rent.</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Item
                </Button>
            </div>

            <AddItemDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onItemAdded={handleItemAdded} />
            {editingItem && (
                <EditItemDialog 
                    isOpen={!!editingItem} 
                    onOpenChange={(isOpen) => !isOpen && setEditingItem(null)} 
                    onItemUpdated={handleItemUpdated}
                    item={editingItem}
                />
            )}

            {userItems.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {userItems.map(item => (
                        <Card key={item.id} className="overflow-hidden">
                            <CardHeader className="p-0">
                                <Image
                                    alt={item.description}
                                    className="rounded-t-lg object-cover w-full aspect-video"
                                    height="180"
                                    src={item.imageUrl}
                                    width="320"
                                    data-ai-hint={item.imageHint}
                                />
                            </CardHeader>
                            <CardContent className="p-4">
                                <CardTitle className="text-lg font-headline">{item.description}</CardTitle>
                                <CardDescription>{item.karma} Karma</CardDescription>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button size="sm" variant="outline" className="w-full" onClick={() => setEditingItem(item)}>Edit</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-20">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h3 className="text-2xl font-bold tracking-tight font-headline">You have no items in your locker</h3>
                        <p className="text-sm text-muted-foreground">Get started by adding an item to rent out.</p>
                        <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
