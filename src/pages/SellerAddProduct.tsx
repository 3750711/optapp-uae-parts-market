import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import VideoUpload from "@/components/ui/video-upload";

const productSchema = z.object({
  title: z.string().min(3, {
    message: "Название должно содержать не менее 3 символов",
  }),
  price: z.string().min(1, {
    message: "Укажите цену товара",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Цена должна быть положительным числом",
  }),
  brand: z.string().min(1, {
    message: "Укажите марку автомобиля",
  }),
  model: z.string().min(1, {
    message: "Укажите модель автомобиля",
  }),
  placeNumber: z.string().min(1, {
    message: "Укажите количество мест",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number.isInteger(Number(val)), {
    message: "Количество мест должно быть целым положительным числом",
  }),
  description: z.string().optional(),
});

const SellerAddProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      price: "",
      brand: "",
      model: "",
      placeNumber: "1",
      description: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (images.length + e.target.files.length > 30) {
        toast({
          title: "Ошибка",
          description: "Максимальное количество фотографий - 30",
          variant: "destructive",
        });
        return;
      }
      
      const filesArray = Array.from(e.target.files);
      
      const newImageUrls = filesArray.map((file) => URL.createObjectURL(file));
      
      setImages((prevImages) => [...prevImages, ...filesArray]);
      setImageUrls((prevUrls) => [...prevUrls, ...newImageUrls]);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imageUrls[index]);
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setImageUrls((prevUrls) => prevUrls.filter((_, i) => i !== index));
  };

  const uploadImages = async (productId: string) => {
    const uploadPromises = images.map(async (file, index) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}/${Date.now()}-${index}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);
        
      if (error) {
        console.error("Error uploading image:", error);
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
        
      return {
        url: publicUrl,
        is_primary: index === 0
      };
    });

    return await Promise.all(uploadPromises);
  };

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    if (!user || !profile) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы как продавец",
        variant: "destructive",
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одну фотографию",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: values.title,
          price: parseFloat(values.price),
          condition: "Новый",
          brand: values.brand,
          model: values.model,
          description: values.description || null,
          seller_id: user.id,
          seller_name: profile.full_name || user.email,
          status: 'pending',
          place_number: parseInt(values.placeNumber),
        })
        .select('id')
        .single() as any;

      if (productError) throw productError;

      const uploadedImages = await uploadImages(product.id);
      
      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(
          uploadedImages.map(img => ({
            product_id: product.id,
            url: img.url,
            is_primary: img.is_primary
          }))
        ) as any;

      if (imagesError) throw imagesError;

      if (videoUrls.length > 0) {
        const { error: videosError } = await supabase
          .from('product_videos')
          .insert(
            videoUrls.map((url, idx) => ({
              product_id: product.id,
              url
            }))
          );

        if (videosError) throw videosError;
      }

      toast({
        title: "Товар добавлен",
        description: "Ваш товар успешно размещен на маркетплейсе",
      });

      navigate('/seller/dashboard');
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Добавить товар</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Информация о товаре</CardTitle>
                  <CardDescription>
                    Заполните все поля для размещения вашего товара на ма��кетплейсе
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название товара</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Например: Передний бампер BMW X5 F15"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Цена ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Информация об автомобиле</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Марка</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Например: BMW" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Модель</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Например: X5" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="placeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество мест для отправки</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="1"
                            placeholder="Укажите количество мест"
                            {...field}
                          />
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
                        <FormLabel>Описание (необязательно)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Подробно опишите товар, его характеристики, состояние и т.д. (необя��ательно)" 
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <Label>Фотографии товара</Label>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                          <img 
                            src={url} 
                            alt={`Product ${index+1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                          >
                            <X size={16} />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1">
                              <p className="text-white text-xs text-center">Главное фото</p>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {images.length < 30 && (
                        <label className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square">
                          <div className="text-3xl text-gray-300">+</div>
                          <p className="text-sm text-gray-500">Добавить фото</p>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageChange}
                            multiple
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Добавьте до 30 фотографий. Первое фото будет главным в объявлении.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Видео товара</Label>
                    <VideoUpload 
                      videos={videoUrls}
                      onUpload={(urls) => setVideoUrls((prev) => [...prev, ...urls])}
                      onDelete={(url) => setVideoUrls((prev) => prev.filter(u => u !== url))}
                      maxVideos={2}
                      storageBucket="product-videos"
                      storagePrefix=""
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-optapp-dark text-optapp-dark hover:bg-optapp-dark hover:text-white"
                    onClick={() => navigate('/seller/dashboard')}
                    disabled={isSubmitting}
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Публикация...
                      </>
                    ) : (
                      'Опубликовать товар'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default SellerAddProduct;
