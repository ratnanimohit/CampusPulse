'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera } from 'lucide-react';

// Dynamically import QrScanner to avoid SSR issues
import dynamic from 'next/dynamic';
const QrScanner = dynamic(() => import('react-qr-scanner'), { ssr: false });


interface QrScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string | null) => void;
  title: string;
  description: string;
}

export function QrScannerDialog({
  isOpen,
  onOpenChange,
  onScan,
  title,
  description,
}: QrScannerDialogProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset permission state each time dialog opens
      setHasCameraPermission(null); 
      
      const getCameraPermission = async () => {
        try {
          // Check for mediaDevices support
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             setHasCameraPermission(false);
             toast({
                variant: 'destructive',
                title: 'Unsupported Browser',
                description: 'Your browser does not support camera access.',
            });
            return;
          }

          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings.',
          });
        }
      };

      getCameraPermission();
    }
  }, [isOpen, toast]);

  const handleScan = (data: { text: string } | null) => {
    if (data) {
      onScan(data.text);
    }
  };

  const handleError = (err: any) => {
    console.error('QR Scanner Error:', err);
    setHasCameraPermission(false); // Assume permission issue or other camera fault
     toast({
        variant: 'destructive',
        title: 'Scanner Error',
        description: 'An error occurred with the camera scanner.',
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="p-4 rounded-lg overflow-hidden relative aspect-video">
          {hasCameraPermission === null && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <p>Requesting camera permission...</p>
              </div>
          )}
          {hasCameraPermission === false && (
             <Alert variant="destructive">
              <Camera className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access in your browser settings to use this feature.
              </AlertDescription>
            </Alert>
          )}
          {hasCameraPermission === true && (
             <div className="w-full h-full">
                <QrScanner
                    delay={300}
                    onError={handleError}
                    onScan={handleScan}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
