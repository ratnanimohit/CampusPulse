'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { KeyRound } from 'lucide-react';
import Image from 'next/image';
import { Badge } from './ui/badge';
import { useUser } from '@/firebase';


export type Transaction = {
  id: string;
  fulfillerId: string;
  requesterId: string;
  itemId: string;
  itemName:string;
  itemImageUrl?: string;
  karma: number;
  status:
    | 'CREATED'
    | 'HANDOVER_PENDING'
    | 'ACTIVE'
    | 'RETURN_PENDING'
    | 'COMPLETED'
    | 'CANCELLED';
  handoverCodeHash: string | null;
  handoverVerified: boolean;
  returnCodeHash: string | null;
  returnVerified: boolean;
  lenderAwardedKarma?: number;
  requesterAwardedKarma?: number;
};

interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const { user } = useUser();

  const getStatusBadgeVariant = () => {
      switch (transaction.status) {
          case 'ACTIVE': return 'default';
          case 'HANDOVER_PENDING':
          case 'RETURN_PENDING': return 'secondary';
          default: return 'outline';
      }
  }

  const userRole = user?.uid === transaction.fulfillerId ? 'Lender' : 'Borrower';

  return (
    <Card className="flex flex-col h-full w-full transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{transaction.itemName}</CardTitle>
        <div className="flex justify-between items-center">
            <Badge variant={getStatusBadgeVariant()}>{transaction.status.replace(/_/g, ' ')}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <KeyRound className="h-4 w-4" />
                <span className="font-bold text-primary">{transaction.karma}</span> Karma
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
          <div className="text-sm text-muted-foreground">
            You are the <span className="font-semibold text-foreground">{userRole}</span>.
          </div>
      </CardContent>
    </Card>
  );
}
