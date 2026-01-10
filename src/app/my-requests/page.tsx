'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAtom } from 'jotai';
import { requestsAtom, type Request } from '@/lib/requests-store';
import { FileX } from 'lucide-react';

export default function MyRequestsPage() {
  const [requests, setRequests] = useAtom(requestsAtom);

  const cancelRequest = (id: string) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">My Requests</CardTitle>
        <CardDescription>
          An overview of all your pending item requests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Required By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.itemName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        req.urgency === 'emergency'
                          ? 'destructive'
                          : req.urgency === 'medium'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(req.requiredBy).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelRequest(req.id)}
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-center py-20 border border-dashed rounded-lg">
            <FileX className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-2xl font-bold tracking-tight font-headline">
              You have no active requests
            </h3>
            <p className="text-sm text-muted-foreground">
              Create a new request to see it here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
