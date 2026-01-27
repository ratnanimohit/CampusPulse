'use client';

import { Mail, Phone, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <h3 className="text-lg font-semibold font-headline mb-2">Contact Us</h3>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
                <a href="mailto:thetechnicalguild@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                    <span>thetechnicalguild@gmail.com</span>
                </a>
                <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>9748652419</span>
                </div>
            </div>
            <div className="flex items-center">
                 <a href="https://www.instagram.com/the_technical_guild" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <Instagram className="h-4 w-4" />
                    <span>the_technical_guild</span>
                </a>
            </div>
        </div>
      </div>
    </footer>
  );
}
