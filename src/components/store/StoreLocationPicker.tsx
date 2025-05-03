
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [currentLocation, setCurrentLocation] = useState(initialLocation || "25.276987, 55.296249"); // Dubai coordinates as default
  const [latitude, setLatitude] = useState(() => {
    if (initialLocation && initialLocation.includes(",")) {
      const [lat] = initialLocation.split(",").map(coord => parseFloat(coord.trim()));
      return !isNaN(lat) ? lat : 25.276987;
    }
    return 25.276987;
  });
  
  const [longitude, setLongitude] = useState(() => {
    if (initialLocation && initialLocation.includes(",")) {
      const parts = initialLocation.split(",");
      if (parts.length > 1) {
        const lng = parseFloat(parts[1].trim());
        return !isNaN(lng) ? lng : 55.296249;
      }
    }
    return 55.296249;
  });

  const handleLocationUpdate = () => {
    try {
      const formattedLocation = `${parseFloat(latitude.toFixed(6))}, ${parseFloat(longitude.toFixed(6))}`;
      setCurrentLocation(formattedLocation);
      onLocationChange(formattedLocation);
      
      toast({
        title: "Местоположение обновлено",
        description: `Координаты: ${formattedLocation}`,
      });
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: "Ошибка обновления местоположения",
        description: "Пожалуйста, введите корректные координаты",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <div className="text-sm font-medium mb-1">Текущие координаты: {currentLocation}</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
          <div>
            <label htmlFor="latitude" className="text-sm text-muted-foreground mb-1 block">Широта</label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
              placeholder="Широта (например, 25.276987)"
            />
          </div>
          <div>
            <label htmlFor="longitude" className="text-sm text-muted-foreground mb-1 block">Долгота</label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
              placeholder="Долгота (например, 55.296249)"
            />
          </div>
        </div>
        
        <Button 
          type="button"
          onClick={handleLocationUpdate}
          className="w-full mt-2"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Обновить координаты
        </Button>
      </div>
    </div>
  );
};

export default StoreLocationPicker;
