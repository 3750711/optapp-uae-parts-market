
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { Car, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const brandSchema = z.object({
  name: z.string().min(1, { message: 'Название марки обязательно' })
});

const modelSchema = z.object({
  brandId: z.string().min(1, { message: 'Выберите марку' }),
  name: z.string().min(1, { message: 'Название модели обязательно' })
});

const AdminCarCatalog = () => {
  const { brands, brandModels, selectBrand, selectedBrand } = useCarBrandsAndModels();
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [isAddingModel, setIsAddingModel] = useState(false);

  // Form for adding a new brand
  const brandForm = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: ''
    }
  });

  // Form for adding a new model
  const modelForm = useForm<z.infer<typeof modelSchema>>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      brandId: '',
      name: ''
    }
  });

  // Handle brand form submission
  const onAddBrand = async (values: z.infer<typeof brandSchema>) => {
    try {
      const { data, error } = await supabase
        .from('car_brands')
        .insert([{ name: values.name }])
        .select();

      if (error) throw error;

      toast.success('Марка успешно добавлена');
      setIsAddingBrand(false);
      brandForm.reset();
      
      // Reload brands (the hook will handle this automatically)
    } catch (error) {
      console.error('Error adding brand:', error);
      toast.error('Ошибка при добавлении марки');
    }
  };

  // Handle model form submission
  const onAddModel = async (values: z.infer<typeof modelSchema>) => {
    try {
      const { data, error } = await supabase
        .from('car_models')
        .insert([{ 
          name: values.name,
          brand_id: values.brandId
        }])
        .select();

      if (error) throw error;

      toast.success('Модель успешно добавлена');
      setIsAddingModel(false);
      modelForm.reset();
      
      // If we had a brand selected, reload its models
      if (selectedBrand === values.brandId) {
        selectBrand(values.brandId);
      }
    } catch (error) {
      console.error('Error adding model:', error);
      toast.error('Ошибка при добавлении модели');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Управление каталогом автомобилей</h1>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Brands management card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Марки автомобилей
                </CardTitle>
                <Dialog open={isAddingBrand} onOpenChange={setIsAddingBrand}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить новую марку</DialogTitle>
                      <DialogDescription>
                        Введите название новой марки автомобиля
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...brandForm}>
                      <form onSubmit={brandForm.handleSubmit(onAddBrand)} className="space-y-4">
                        <FormField
                          control={brandForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Название марки</FormLabel>
                              <FormControl>
                                <Input placeholder="Например: Toyota" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsAddingBrand(false)}>
                            Отмена
                          </Button>
                          <Button type="submit">Добавить</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {brands.length > 0 ? (
                  <ul className="space-y-2 divide-y">
                    {brands.map((brand) => (
                      <li key={brand.id} className="py-2">
                        {brand.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет доступных марок
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Models management card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Модели автомобилей
                </CardTitle>
                <Dialog open={isAddingModel} onOpenChange={setIsAddingModel}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить новую модель</DialogTitle>
                      <DialogDescription>
                        Выберите марку и введите название модели
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...modelForm}>
                      <form onSubmit={modelForm.handleSubmit(onAddModel)} className="space-y-4">
                        <FormField
                          control={modelForm.control}
                          name="brandId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Марка</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите марку" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {brands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id}>
                                      {brand.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={modelForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Название модели</FormLabel>
                              <FormControl>
                                <Input placeholder="Например: Camry" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsAddingModel(false)}>
                            Отмена
                          </Button>
                          <Button type="submit">Добавить</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <CardDescription>
                Выберите марку, чтобы увидеть доступные модели
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select
                  value={selectedBrand || ''}
                  onValueChange={(value) => selectBrand(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите марку" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2">
                {selectedBrand ? (
                  brandModels.length > 0 ? (
                    <ul className="space-y-2 divide-y">
                      {brandModels.map((model) => (
                        <li key={model.id} className="py-2">
                          {model.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Нет доступных моделей для этой марки
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Выберите марку, чтобы увидеть модели
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCarCatalog;
