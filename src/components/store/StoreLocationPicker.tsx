
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface LocationPickerProps {
  initialLocation: string;
  onLocationChange: (location: string) => void;
}

const StoreLocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationChange
}) => {
  const [address, setAddress] = useState(initialLocation || "");
  const { user } = useAuth();
  
  useEffect(() => {
    // Fetch profile location when component mounts
    const fetchProfileLocation = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data?.location && !initialLocation) {
          setAddress(data.location);
          onLocationChange(data.location);
        }
      } catch (error) {
        console.error("Error fetching profile location:", error);
      }
    };
    
    fetchProfileLocation();
  }, [user, initialLocation, onLocationChange]);

  const handleLocationUpdate = () => {
    try {
      onLocationChange(address);
      
      toast({
        title: "Местоположение обновлено",
        description: `Адрес: ${address}`,
      });
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: "Ошибка обновления местоположения",
        description: "Пожалуйста, введите корректный адрес",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <div className="text-sm font-medium mb-1">Текущий адрес: {address}</div>
        
        <div className="mb-2">
          <Input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Введите адрес местонахождения"
          />
        </div>
        
        <Button 
          type="button"
          onClick={handleLocationUpdate}
          className="w-full mt-2"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Обновить адрес
        </Button>
      </div>
    </div>
  );
};

export default StoreLocationPicker;
