
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export interface BrandModel {
  id: string;
  name: string;
  type: "brand" | "model";
  parentId?: string; // brand_id for models
  parentName?: string; // brand name for models
}

interface BrandModelSelectorProps {
  onBrandChange: (brandId: string) => void;
  onModelChange: (modelId: string | undefined) => void;
  selectedBrandId: string;
  selectedModelId?: string;
}

export function BrandModelSelector({
  onBrandChange,
  onModelChange,
  selectedBrandId,
  selectedModelId
}: BrandModelSelectorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<BrandModel[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<BrandModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Get the brand and model names for display
  const selectedBrand = options.find(option => option.id === selectedBrandId && option.type === "brand");
  const selectedModel = options.find(option => option.id === selectedModelId && option.type === "model");

  // Determine the display text for the selector
  const displayValue = selectedModel 
    ? `${selectedModel.parentName} ${selectedModel.name}`
    : selectedBrand 
      ? selectedBrand.name
      : "Выберите марку/модель";

  // Fetch all brands and models
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch brands
        const { data: brandsData, error: brandsError } = await supabase
          .from('car_brands')
          .select('id, name')
          .order('name');

        if (brandsError) throw brandsError;

        const brandOptions: BrandModel[] = (brandsData || []).map(brand => ({
          id: brand.id,
          name: brand.name,
          type: "brand"
        }));

        // Fetch models for all brands (in production, consider paginating or fetching on demand)
        const { data: modelsData, error: modelsError } = await supabase
          .from('car_models')
          .select('id, name, brand_id')
          .order('name');

        if (modelsError) throw modelsError;

        // Create a lookup for brand names
        const brandLookup = new Map(brandOptions.map(brand => [brand.id, brand.name]));
        
        // Create model options with parent brand info
        const modelOptions: BrandModel[] = (modelsData || []).map(model => ({
          id: model.id,
          name: model.name,
          type: "model",
          parentId: model.brand_id,
          parentName: brandLookup.get(model.brand_id) || ""
        }));

        // Combine all options
        setOptions([...brandOptions, ...modelOptions]);

        // Fetch recently used items if user is logged in
        if (user) {
          await fetchRecentlyUsed(brandLookup);
        }
      } catch (error) {
        console.error("Error fetching brands and models:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список марок и моделей",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // Fetch recently used brands/models for the current user
  const fetchRecentlyUsed = async (brandLookup: Map<string, string>) => {
    if (!user) return;

    try {
      // Get user's recently used brands/models from their products
      const { data: recentProducts, error } = await supabase
        .from('products')
        .select('brand, model')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (recentProducts && recentProducts.length > 0) {
        // Process the recent items into a format consistent with our options
        const recentItems: BrandModel[] = [];
        const uniqueCombos = new Set<string>(); // To prevent duplicates

        for (const product of recentProducts) {
          const combo = `${product.brand}:${product.model || ''}`;
          if (uniqueCombos.has(combo)) continue;
          uniqueCombos.add(combo);

          // Find the brand in the options
          const brandOption = options.find(
            option => option.type === "brand" && option.name === product.brand
          );
          
          if (brandOption) {
            // Add brand if it's not already in the recent items
            if (!recentItems.some(item => item.id === brandOption.id)) {
              recentItems.push(brandOption);
            }

            // If model exists, add the model too
            if (product.model) {
              // Find the model option
              const modelOption = options.find(
                option => option.type === "model" && 
                           option.parentId === brandOption.id && 
                           option.name === product.model
              );

              if (modelOption) {
                recentItems.push(modelOption);
              }
            }
          }

          // Limit to 5 total items
          if (recentItems.length >= 5) break;
        }

        setRecentlyUsed(recentItems);
      }
    } catch (error) {
      console.error("Error fetching recently used brands/models:", error);
    }
  };

  // Handle selection of a brand or model
  const handleSelect = (value: string) => {
    const selectedOption = options.find(option => option.id === value);
    
    if (!selectedOption) return;
    
    if (selectedOption.type === "brand") {
      // Selected a brand
      onBrandChange(selectedOption.id);
      onModelChange(undefined); // Clear model when brand changes
    } else {
      // Selected a model - also set its parent brand
      if (selectedOption.parentId) {
        onBrandChange(selectedOption.parentId);
        onModelChange(selectedOption.id);
      }
    }
    setOpen(false);
  };

  // Filter options based on search term
  const filteredOptions = searchTerm
    ? options.filter(option => {
        const searchLower = searchTerm.toLowerCase();
        
        // For brands, search just the brand name
        if (option.type === "brand") {
          return option.name.toLowerCase().includes(searchLower);
        }
        
        // For models, search both model name and parent brand name
        return option.name.toLowerCase().includes(searchLower) || 
               (option.parentName && option.parentName.toLowerCase().includes(searchLower));
      })
    : options;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto py-2 px-3"
        >
          <span className="truncate text-left">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 max-h-[300px] overflow-auto" align="start">
        <Command>
          <CommandInput
            placeholder="Поиск марки или модели..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="h-9"
          />
          
          {/* Recently Used Section */}
          {recentlyUsed.length > 0 && searchTerm.length === 0 && (
            <>
              <CommandGroup heading="Недавно использованные">
                {recentlyUsed.map(option => (
                  <CommandItem
                    key={`recent-${option.id}`}
                    value={option.id}
                    onSelect={handleSelect}
                    className="flex items-center"
                  >
                    <span className="flex-1 truncate">
                      {option.type === "model" ? 
                        `${option.parentName} ${option.name}` : 
                        option.name}
                    </span>
                    {((option.type === "brand" && option.id === selectedBrandId) ||
                      (option.type === "model" && option.id === selectedModelId)) && (
                      <Check className="ml-2 h-4 w-4 text-green-500" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <Separator className="my-1" />
            </>
          )}
          
          {/* All Brands Section */}
          <CommandGroup heading={searchTerm ? "Результаты поиска" : "Все марки и модели"}>
            {filteredOptions.length > 0 ? (
              filteredOptions.slice(0, 100).map(option => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={handleSelect}
                  className="flex items-center"
                >
                  <span 
                    className={cn(
                      "flex-1 truncate",
                      option.type === "model" && "ml-2 text-sm"
                    )}
                  >
                    {option.type === "model" ? 
                      `${option.parentName} ${option.name}` : 
                      option.name}
                  </span>
                  {((option.type === "brand" && option.id === selectedBrandId) ||
                    (option.type === "model" && option.id === selectedModelId)) && (
                    <Check className="ml-2 h-4 w-4 text-green-500" />
                  )}
                </CommandItem>
              ))
            ) : (
              <CommandEmpty>
                {loading ? "Загрузка..." : "Ничего не найдено"}
              </CommandEmpty>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
