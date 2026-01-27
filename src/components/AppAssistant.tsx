'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare, Send, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from './ui/scroll-area';
import { appAssistant } from '@/ai/flows/app-assistant-flow';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Logo } from './Logo';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export function AppAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hi! I'm AskIt. How can I help you navigate the app or answer your questions?",
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);


    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await appAssistant({
                query: input,
                history: messages,
            });
            const assistantMessage: Message = { role: 'assistant', content: response.answer };
            setMessages([...newMessages, assistantMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages([...newMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 100);
        }
    }, [messages, isLoading]);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    size="icon"
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
                >
                    <MessageSquare className="h-6 w-6" />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-80 md:w-96 p-0 mr-4 mb-2 rounded-xl shadow-2xl">
                <div className="flex flex-col h-[60vh] max-h-[500px]">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold font-headline">AskIt</h3>
                         <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-6 w-6">
                            <X className="h-4 w-4" />
                         </Button>
                    </div>
                    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : '')}>
                                    {message.role === 'assistant' && (
                                        <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                           <div className="flex h-full w-full items-center justify-center">
                                                <Logo className="h-5 w-5 text-primary-foreground" />
                                            </div>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "rounded-lg px-3 py-2 max-w-[85%]",
                                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                    )}>
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                    {message.role === 'user' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                             {isLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                        <div className="flex h-full w-full items-center justify-center">
                                            <Logo className="h-5 w-5 text-primary-foreground" />
                                        </div>
                                    </Avatar>
                                    <div className="rounded-lg px-3 py-2 bg-muted flex items-center">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Ask a question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                                disabled={isLoading}
                            />
                            <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
