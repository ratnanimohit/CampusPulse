'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash } from "lucide-react";
import Image from 'next/image';
import { AddItemDialog, type NewItem } from '@/components/add-item-dialog';
import { EditItemDialog, type EditedItem } from '@/components/edit-item-dialog';
import { DeleteItemDialog } from '@/components/delete-item-dialog';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export type Item = {
    id: string;
    name: string;
    imageUrl: string;
    karma: number;
    ownerId: string;
};

export default function LockerPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [deletingItem, setDeletingItem] = useState<Item | null>(null);

    const userItemsQuery = useMemoFirebase(() => 
        (user && firestore) ? query(collection(firestore, 'itemListings'), where('ownerId', '==', user.uid)) : null
    , [user, firestore]);

    const { data: userItems, isLoading: isLoadingItems } = useCollection<Item>(userItemsQuery);

    const handleItemAdded = (newItem: NewItem) => {
        if (!user || !firestore) return;
        const itemData = {
            name: newItem.itemName,
            imageUrl: newItem.photoDataUri || 'https://picsum.photos/seed/placeholder/320/180',
            karma: newItem.karma,
            ownerId: user.uid,
            available: true,
        };
        const itemListingsCol = collection(firestore, 'itemListings');
        addDocumentNonBlocking(itemListingsCol, itemData);
    };

    const handleItemUpdated = (updatedItem: EditedItem) => {
        if (!firestore) return;
        const itemDocRef = doc(firestore, 'itemListings', updatedItem.id);
        
        setDocumentNonBlocking(itemDocRef, {
            name: updatedItem.itemName,
            karma: updatedItem.karma,
        }, { merge: true });
        
        setEditingItem(null);
    };

    const handleItemDeleted = (itemId: string) => {
        if (!firestore) return;
        const itemDocRef = doc(firestore, 'itemListings', itemId);
        deleteDocumentNonBlocking(itemDocRef);
        setDeletingItem(null);
    };
    
    if (isUserLoading || isLoadingItems) {
        return <div>Loading locker...</div>;
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Locker</h1>
                    <p className="text-muted-foreground">Items you have listed for rent.</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)} disabled={!user}>
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

            {deletingItem && (
                <DeleteItemDialog
                    isOpen={!!deletingItem}
                    onOpenChange={() => setDeletingItem(null)}
                    onConfirm={() => handleItemDeleted(deletingItem.id)}
                    itemName={deletingItem.name}
                />
            )}

            {userItems && userItems.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {userItems.map(item => (
                        <Card key={item.id} className="overflow-hidden">
                            <CardHeader className="p-0">
                                <Image
                                    alt={item.name}
                                    className="rounded-t-lg object-cover w-full aspect-video"
                                    height="180"
                                    src={item.imageUrl}
                                    width="320"
                                    data-ai-hint={'item'}
                                />
                            </CardHeader>
                            <CardContent className="p-4">
                                <CardTitle className="text-lg font-headline">{item.name}</CardTitle>
                                <CardDescription>{item.karma} Karma</CardDescription>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
                                <Button size="sm" variant="outline" className="w-full" onClick={() => setEditingItem(item)}>Edit</Button>
                                <Button size="sm" variant="destructive" className="w-full" onClick={() => setDeletingItem(item)}>
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-20">
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h3 className="text-2xl font-bold tracking-tight font-headline">You have no items in your locker</h3>
                        <p className="text-sm text-muted-foreground">Get started by adding an item to rent out.</p>
                        <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)} disabled={!user}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
