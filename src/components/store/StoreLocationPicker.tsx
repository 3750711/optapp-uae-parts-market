
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
  const [currentLocation, setCurrentLocation] = useState(initialLocation || "25.276987, 55.296249"); // Dubai coordinates as default
  const [mapUrl, setMapUrl] = useState("");
  const [selectedMarker, setSelectedMarker] = useState<{ lat: number; lng: number } | null>(null);

  // Parse initial location if it's in coordinate format
  useEffect(() => {
    try {
      if (initialLocation && initialLocation.includes(",")) {
        const [lat, lng] = initialLocation.split(",").map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          setSelectedMarker({ lat, lng });
        }
      }
    } catch (error) {
      console.error("Error parsing initial location:", error);
    }
  }, [initialLocation]);

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
              
              // This is a simplified calculation for demo purposes
              // In a real application, we would need more accurate geo calculations
              const mapBounds = window.mapBounds;
              if (!mapBounds) {
                // Approximate calculation if bounds not available
                const centerLat = 25.276987; // Default center latitude (Dubai)
                const centerLng = 55.296249; // Default center longitude (Dubai)
                const latPerPixel = 0.01 / (rect.height / 2);
                const lngPerPixel = 0.01 / (rect.width / 2);
                
                const clickLat = centerLat - (y - rect.height/2) * latPerPixel;
                const clickLng = centerLng + (x - rect.width/2) * lngPerPixel;
                
                window.parent.postMessage({
                  type: 'MAP_LOCATION_SELECTED',
                  latitude: clickLat,
                  longitude: clickLng
                }, '*');
              } else {
                // Use map bounds for more accurate calculation
                // This would require access to Google Maps API directly
                // Simplified approximation for now
                const n = mapBounds.north;
                const s = mapBounds.south;
                const e = mapBounds.east;
                const w = mapBounds.west;
                
                const latRatio = (rect.height - y) / rect.height;
                const lngRatio = x / rect.width;
                
                const clickLat = s + (n - s) * latRatio;
                const clickLng = w + (e - w) * lngRatio;
                
                window.parent.postMessage({
                  type: 'MAP_LOCATION_SELECTED',
                  latitude: clickLat,
                  longitude: clickLng
                }, '*');
              }
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
