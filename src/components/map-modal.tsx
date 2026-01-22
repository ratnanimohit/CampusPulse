'use client';

import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type ItemRequest = {
  id: string;
  itemName: string;
  requesterId: string;
  location?: {
    lat: number;
    lng: number;
  };
};

interface MapModalProps {
  request: ItemRequest | null;
  onClose: () => void;
  onConfirm: (request: ItemRequest) => void;
  isFulfilling: boolean;
}

const containerStyle = {
  width: '100%',
  height: '400px',
};

const libraries: ('places')[] = ['places'];

export function MapModal({ request, onClose, onConfirm, isFulfilling }: MapModalProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const hasLocation = !!request?.location;

  const handleConfirm = () => {
    if (request) {
      onConfirm(request);
    }
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Borrower Location for "{request?.itemName}"</DialogTitle>
          <DialogDescription>
            This map shows the approximate location of the user who requested the item.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg overflow-hidden border">
          {hasLocation && isLoaded && (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={request.location}
              zoom={12}
            >
              <Marker position={request.location!} />
            </GoogleMap>
          )}
          {!hasLocation && (
            <div className="h-96 flex items-center justify-center bg-muted text-muted-foreground">
              Location data is not available for this request.
            </div>
          )}
          {loadError && (
             <div className="h-96 flex items-center justify-center bg-destructive/10 text-destructive">
              Error loading map.
            </div>
          )}
          {!isLoaded && hasLocation && (
              <div className="h-96 flex items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!hasLocation || isFulfilling}>
            {isFulfilling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Fulfill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
