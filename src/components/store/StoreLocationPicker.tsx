
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  initialLocation: string;
  onLocationChange: (location: string) => void;
}

const StoreLocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(initialLocation || "Dubai");
  const [mapUrl, setMapUrl] = useState("");

  // Update map URL when location changes
  useEffect(() => {
    setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(currentLocation)}&output=embed`);
  }, [currentLocation]);

  // Setup click handler on map iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // This will receive messages from our injected script in the iframe
      if (event.data && event.data.type === 'MAP_LOCATION_SELECTED') {
        const { latitude, longitude, address } = event.data;
        const locationString = address || `${latitude}, ${longitude}`;
        setCurrentLocation(locationString);
        onLocationChange(locationString);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLocationChange]);

  // Inject click handler script into iframe
  useEffect(() => {
    if (!mapLoaded) return;

    const iframe = document.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) return;

    // Try to inject script once the iframe has loaded
    const injectScript = () => {
      try {
        if (iframe.contentDocument) {
          // Create script element
          const script = document.createElement('script');
          script.textContent = `
            // Make the map interactive
            document.addEventListener('click', function(e) {
              // Get click coordinates
              const lat = e.clientY / window.innerHeight * 180 - 90;
              const lng = e.clientX / window.innerWidth * 360 - 180;
              
              // Geocode the coordinates (simplified version)
              const address = "Selected location";
              
              // Send message to parent window
              window.parent.postMessage({
                type: 'MAP_LOCATION_SELECTED',
                latitude: lat.toFixed(6),
                longitude: lng.toFixed(6),
                address: address
              }, '*');
            });
          `;
          iframe.contentDocument.body.appendChild(script);
        }
      } catch (error) {
        console.error("Error injecting script into iframe:", error);
      }
    };

    // Attempt to inject after iframe loads
    iframe.addEventListener('load', injectScript);
    
    return () => {
      iframe.removeEventListener('load', injectScript);
    };
  }, [mapLoaded]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <div className="text-sm font-medium mb-1">Текущее местоположение: {currentLocation}</div>
        
        <div 
          className="relative aspect-[16/9] w-full border rounded-md overflow-hidden"
          ref={mapRef}
        >
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps"
            onLoad={() => setMapLoaded(true)}
          ></iframe>
          
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/5 pointer-events-none" />
          
          <div className="absolute bottom-2 left-2 right-2 flex justify-center">
            <Button 
              variant="secondary" 
              size="sm" 
              className="text-xs bg-white/90 shadow-md"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Нажмите на карту, чтобы выбрать местоположение
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreLocationPicker;
