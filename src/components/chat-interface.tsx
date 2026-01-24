'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Loader2, Send } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


type Message = {
    id: string;
    senderId: string;
    text: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    } | any;
};

const chatSchema = z.object({
    text: z.string().min(1, "Message cannot be empty"),
});

type ChatFormValues = z.infer<typeof chatSchema>;

interface ChatInterfaceProps {
    transactionId: string;
    participants: { id: string; name: string; avatar: string }[];
}


export function ChatInterface({ transactionId, participants }: ChatInterfaceProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [isSending, setIsSending] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const messagesQuery = useMemoFirebase(
        () => (firestore && transactionId) ?
            query(
                collection(firestore, 'transactions', transactionId, 'messages'),
                orderBy('createdAt', 'asc')
            ) : null,
        [firestore, transactionId]
    );

    const { data: messages, isLoading: isLoadingMessages } = useCollection<Message>(messagesQuery);

    const form = useForm<ChatFormValues>({
        resolver: zodResolver(chatSchema),
        defaultValues: { text: '' },
    });

    const onSubmit = async (data: ChatFormValues) => {
        if (!user || !firestore) return;
        setIsSending(true);

        const messagesColRef = collection(firestore, 'transactions', transactionId, 'messages');
        try {
            await addDoc(messagesColRef, {
                senderId: user.uid,
                text: data.text,
                createdAt: serverTimestamp(),
            });
            form.reset();
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };
    
    // Auto-scroll to bottom
     useEffect(() => {
        const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 100);
        }
    }, [messages]);

    const getParticipantInfo = (senderId: string) => {
        const participant = participants.find(p => p.id === senderId);
        if (!participant) {
            return { name: "Unknown", initial: "?", avatar: "" };
        };
        const nameParts = participant.name.split(" ");
        const initial = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[1]?.[0] || ''}` : (nameParts[0]?.[0] || '?');
        return {
            name: participant.name,
            initial: initial.toUpperCase(),
            avatar: participant.avatar,
        }
    }

    return (
        <div className="flex flex-col h-full bg-card">
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {isLoadingMessages ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages && messages.length > 0 ? (
                        messages.map(msg => {
                            const participantInfo = getParticipantInfo(msg.senderId);
                            return (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                                    {msg.senderId !== user?.uid && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={participantInfo.avatar} alt={participantInfo.name} data-ai-hint="person avatar" />
                                            <AvatarFallback>{participantInfo.initial}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "rounded-lg px-3 py-2 max-w-[70%]",
                                        msg.senderId === user?.uid
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    )}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                        <p className={cn(
                                            "text-xs opacity-70 mt-1",
                                            msg.senderId === user?.uid ? "text-right" : "text-left"
                                        )}>
                                            {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'p') : ''}
                                        </p>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-10">
                            No messages yet. Start the conversation!
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t bg-background">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                        <FormField
                            control={form.control}
                            name="text"
                            render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormControl>
                                        <Input placeholder="Type a message..." {...field} disabled={isSending} autoComplete="off" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" size="icon" disabled={isSending}>
                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
