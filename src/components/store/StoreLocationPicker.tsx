
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
  const [selectedMarker, setSelectedMarker] = useState<{ lat: number; lng: number } | null>(null);

  // Update map URL when location changes
  useEffect(() => {
    setMapUrl(`https://maps.google.com/maps?q=${encodeURIComponent(currentLocation)}&output=embed`);
  }, [currentLocation]);

  // Handle location selection when user clicks on the map
  const handleLocationSelect = async (lat: number, lng: number) => {
    try {
      // Store coordinates in a readable format
      const locationString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setCurrentLocation(locationString);
      onLocationChange(locationString);
      setSelectedMarker({ lat, lng });
      
      toast({
        title: "Местоположение выбрано",
        description: `Координаты: ${locationString}`,
      });
    } catch (error) {
      console.error("Error selecting location:", error);
      toast({
        title: "Ошибка выбора местоположения",
        description: "Не удалось выбрать местоположение",
        variant: "destructive",
      });
    }
  };

  // Setup click handler on map iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // This will receive messages from our injected script in the iframe
      if (event.data && event.data.type === 'MAP_LOCATION_SELECTED') {
        const { latitude, longitude } = event.data;
        handleLocationSelect(latitude, longitude);
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

    try {
      // Try to inject script once the iframe has loaded
      iframe.addEventListener('load', () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!iframeDoc) return;
          
          // Create script element
          const script = document.createElement('script');
          script.textContent = `
            document.addEventListener('click', function(e) {
              // Get map container coordinates
              const mapContainer = document.querySelector('div[role="application"]');
              if (!mapContainer) return;
              
              // Calculate click position relative to the map
              const rect = mapContainer.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              
              // Convert to geo coordinates (approximate)
              // This is a simplified calculation and not 100% accurate
              const latPerPixel = 180 / mapContainer.clientHeight;
              const lngPerPixel = 360 / mapContainer.clientWidth;
              
              const centerLat = 0; // Assuming center is at equator
              const centerLng = 0; // Assuming center is at prime meridian
              
              const clickLat = centerLat + (mapContainer.clientHeight/2 - y) * latPerPixel;
              const clickLng = centerLng + (x - mapContainer.clientWidth/2) * lngPerPixel;
              
              // Send message to parent window
              window.parent.postMessage({
                type: 'MAP_LOCATION_SELECTED',
                latitude: clickLat,
                longitude: clickLng
              }, '*');
            });
          `;
          
          // Add the script to the iframe's document
          iframeDoc.body.appendChild(script);
        } catch (error) {
          console.error("Error accessing iframe document:", error);
        }
      });
    } catch (error) {
      console.error("Error injecting script into iframe:", error);
    }
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
