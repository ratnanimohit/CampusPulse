'use client';

import { useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface MapLoadErrorProps {
  loadError: Error;
}

export function MapLoadError({ loadError }: MapLoadErrorProps) {
  const { toast } = useToast();
  const isBillingError = loadError.message.includes('BillingNotEnabledMapError');
  const isInvalidKeyError = loadError.message.includes('InvalidKeyMapError');
  const isApiProjectError = loadError.message.includes('ApiProjectMapError');

  let title = "Map Error";
  let description = "Could not load the map. Please try again later.";

  if (isBillingError) {
    title = "Google Maps Billing Not Enabled";
    description = "The Google Cloud project for this API key does not have billing enabled. Please enable billing in the Google Cloud Console to use Maps.";
  } else if (isInvalidKeyError) {
    title = "Invalid Google Maps API Key";
    description = "The provided Google Maps API key is invalid. Please check the key in your configuration.";
  } else if (isApiProjectError) {
    title = "Google Maps API Not Enabled";
    description = "The Maps JavaScript API is not enabled for your Google Cloud project. Please enable it in the Google Cloud Console.";
  }
   else {
    description = `Could not load map. An unknown error occurred.`;
  }

  useEffect(() => {
    toast({
        variant: 'destructive',
        title: title,
        description: description,
    })
  }, [toast, title, description]);

  return (
    <div className="h-full w-full flex items-center justify-center bg-destructive/10 p-4">
      <Alert variant="destructive" className="border-0 bg-transparent">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
    </div>
  );
}
