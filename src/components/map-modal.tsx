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

const MapModalMap = ({ location }: { location: { lat: number; lng: number } }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    if (loadError) {
        return <MapLoadError loadError={loadError} />;
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
            center={location}
            zoom={12}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
        >
            <Marker position={location} />
        </GoogleMap>
    );
};


export function MapModal({ request, onClose, onConfirm, isFulfilling }: MapModalProps) {
  const hasApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== 'PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE';
  const hasLocation = !!request?.location;

  const handleConfirm = () => {
    if (request) {
      onConfirm(request);
    }
  };

  const renderMapContent = () => {
    if (!hasApiKey) {
        return (
             <div className="h-full flex items-center justify-center bg-muted text-muted-foreground text-center p-4">
               Google Maps API Key is not configured. Map functionality is disabled.
            </div>
        );
    }
    if (!hasLocation) {
        return (
            <div className="h-full flex items-center justify-center bg-muted text-muted-foreground">
                Location data is not available for this request.
            </div>
        );
    }
    
    return <MapModalMap location={request.location!} />;
  }

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Borrower Location for "{request?.itemName}"</DialogTitle>
          <DialogDescription>
            {!hasApiKey
                ? "The map is unavailable because the Google Maps API key is not configured, but you can still fulfill the request and coordinate via chat."
                : !hasLocation 
                ? "The map is unavailable because location data was not provided for this request. You can still fulfill the request and coordinate via chat."
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
          <Button onClick={handleConfirm} disabled={isFulfilling}>
            {isFulfilling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Fulfill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
