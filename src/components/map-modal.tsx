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
import { MapLoadError } from './map-load-error';

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
  height: '100%',
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

  const renderMapContent = () => {
    if (loadError) {
      return <MapLoadError loadError={loadError} />;
    }
    if (!hasLocation) {
        return (
            <div className="h-full flex items-center justify-center bg-muted text-muted-foreground">
                Location data is not available for this request.
            </div>
        );
    }
    if (!isLoaded) {
        return (
            <div className="h-full flex items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={request.location}
            zoom={12}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
        >
            <Marker position={request.location!} />
        </GoogleMap>
    );
  }

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Borrower Location for "{request?.itemName}"</DialogTitle>
          <DialogDescription>
            {loadError
                ? "The map is unavailable, but you can still fulfill the request and coordinate via chat."
                : "This map shows the approximate location of the user who requested the item."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="h-[400px] rounded-lg overflow-hidden border">
            {renderMapContent()}
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
