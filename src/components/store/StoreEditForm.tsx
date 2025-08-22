import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { StoreTag } from "@/types/store";
import { MapPin } from "lucide-react";
import StoreLocationPicker from "./StoreLocationPicker";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProfileTranslations } from "@/utils/profileTranslations";
import { useLanguage } from "@/hooks/useLanguage";

const storeFormSchema = z.object({
  name: z.string().min(3, 'Название должно быть не менее 3 символов'),
  description: z.string().optional(),
  address: z.string().min(5, 'Адрес должен быть не менее 5 символов'),
  phone: z.string().optional(),
  location: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

interface StoreEditFormProps {
  sellerId: string;
  onSuccess?: () => void;
}

const StoreEditForm: React.FC<StoreEditFormProps> = ({ sellerId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const t = getProfileTranslations(language);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      location: '',
    },
  });

  useEffect(() => {
    async function fetchStoreData() {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select(`*, store_images(url)`)
          .eq('seller_id', sellerId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setStoreData(data);
          setStoreId(data.id);
          
          form.reset({
            name: data.name,
            description: data.description || '',
            address: data.address,
            phone: data.phone || '',
            location: data.location || '',
          });
          
          // Extract images from store_images
          if (data.store_images && data.store_images.length > 0) {
            const imageUrls = data.store_images.map((img: any) => img.url);
            setImages(imageUrls);
          }
        }
      } catch (error) {
        console.error("Error fetching store data:", error);
      }
    }

    // Fetch user's profile location
    async function fetchProfileLocation() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data?.location) {
          form.setValue('location', data.location);
        }
      } catch (error) {
        console.error("Error fetching profile location:", error);
      }
    }

    if (sellerId) {
      fetchStoreData();
      fetchProfileLocation();
    }
  }, [sellerId, user]);

  const onSubmit = async (values: StoreFormValues) => {
    setIsLoading(true);
    
    try {
      if (storeId) {
        // Update existing store
        const { error } = await supabase
          .from('stores')
          .update({
            name: values.name,
            description: values.description || null,
            address: values.address,
            phone: values.phone || null,
            location: values.location || null,
          })
          .eq('id', storeId);
          
        if (error) throw error;
        
        // Handle existing images if needed
        if (images.length > 0) {
          // First delete all existing images
          const { error: deleteError } = await supabase
            .from('store_images')
            .delete()
            .eq('store_id', storeId);
            
          if (deleteError) throw deleteError;
          
          // Then add the current images
          const storeImages = images.map(url => ({
            store_id: storeId,
            url,
            is_primary: images.indexOf(url) === 0,
          }));
          
          if (storeImages.length > 0) {
            const { error: imagesError } = await supabase
              .from('store_images')
              .insert(storeImages);
              
            if (imagesError) throw imagesError;
          }
        }

        toast(t.storeUpdated, {
          description: t.storeUpdatedDesc,
        });
        
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error('Error updating store:', error);
      toast(t.storeUpdateError, {
        description: error.message || t.storeUpdateErrorDesc,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!storeData && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.storeInfo}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t.noStoreYet}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleLocationChange = (newLocation: string) => {
    form.setValue('location', newLocation);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.storeManagement}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-1 w-full mb-4">
            <TabsTrigger value="general">{t.generalInfo}</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t.storeName} *</FormLabel>
                       <FormControl>
                         <Input placeholder={t.storeNamePlaceholder} {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t.storeDescription}</FormLabel>
                       <FormControl>
                         <Textarea 
                           placeholder={t.storeDescriptionPlaceholder} 
                           className="min-h-[120px]" 
                           {...field} 
                           value={field.value || ''}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t.storeAddress} *</FormLabel>
                       <FormControl>
                         <Input placeholder={t.storeAddressPlaceholder} {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t.storePhone}</FormLabel>
                       <FormControl>
                         <Input placeholder={t.storePhonePlaceholder} {...field} value={field.value || ''} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                     <FormItem>
                       <FormLabel>{t.storeLocation}</FormLabel>
                       <FormControl>
                         <StoreLocationPicker 
                           initialLocation={field.value || ''} 
                           onLocationChange={handleLocationChange}
                         />
                       </FormControl>
                       <FormDescription>
                         {t.storeLocationDescription}
                       </FormDescription>
                       <FormMessage />
                     </FormItem>
                  )}
                />

                 <div className="space-y-2">
                   <FormLabel>{t.storePhotos}</FormLabel>
                   <p className="text-sm text-muted-foreground mb-2">
                     {t.storePhotosDescription}
                   </p>
                   <ImageUpload 
                     images={images}
                     onUpload={(uploadedUrls) => setImages([...images, ...uploadedUrls])}
                     onDelete={(url) => setImages(images.filter(img => img !== url))}
                     maxImages={10}
                     translations={t.imageUpload}
                   />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                   {isLoading ? t.saving : t.saveChanges}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StoreEditForm;
