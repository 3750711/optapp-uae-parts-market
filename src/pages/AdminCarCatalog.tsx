import React, { useState, useCallback, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, X, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Schema for adding a new brand
const brandSchema = z.object({
  name: z.string()
    .min(1, { message: "Название марки не может быть пустым" })
    .max(100, { message: "Название марки не может быть длиннее 100 символов" }),
});
type BrandFormValues = z.infer<typeof brandSchema>;

// Schema for adding a new model
const modelSchema = z.object({
  name: z.string()
    .min(1, { message: "Название модели не может быть пустым" })
    .max(100, { message: "Название модели не может быть длиннее 100 символов" }),
  brandId: z.string()
    .min(1, { message: "Выберите марку" }),
});
type ModelFormValues = z.infer<typeof modelSchema>;

const AdminCarCatalog = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addBrandDialogOpen, setAddBrandDialogOpen] = useState(false);
  const [addModelDialogOpen, setAddModelDialogOpen] = useState(false);
  const [selectedBrandForEdit, setSelectedBrandForEdit] = useState<string | null>(null);
  const [selectedModelForEdit, setSelectedModelForEdit] = useState<string | null>(null);
  const [searchBrandTerm, setSearchBrandTerm] = useState("");
  const [searchModelTerm, setSearchModelTerm] = useState("");
  const [isSeedingData, setIsSeedingData] = useState(false);
  
  const { 
    brands, 
    brandModels, 
    selectBrand, 
    selectedBrand,
    isLoading: isLoadingCarData
  } = useCarBrandsAndModels();

  // Filter brands based on search term
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
  );

  // Filter models based on search term and selected brand
  const filteredModels = brandModels.filter(model => 
    model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
  );

  // Form for adding/editing a brand
  const brandForm = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: "",
    },
  });

  // Form for adding/editing a model
  const modelForm = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      name: "",
      brandId: "",
    },
  });

  // Effect to update model form when editing
  React.useEffect(() => {
    if (selectedModelForEdit) {
      const modelToEdit = brandModels.find(model => model.id === selectedModelForEdit);
      if (modelToEdit) {
        modelForm.setValue("name", modelToEdit.name);
        modelForm.setValue("brandId", modelToEdit.brand_id);
      }
    }
  }, [selectedModelForEdit, brandModels, modelForm]);

  // Effect to update brand form when editing
  React.useEffect(() => {
    if (selectedBrandForEdit) {
      const brandToEdit = brands.find(brand => brand.id === selectedBrandForEdit);
      if (brandToEdit) {
        brandForm.setValue("name", brandToEdit.name);
      }
    }
  }, [selectedBrandForEdit, brands, brandForm]);

  // Mutation for adding a brand
  const addBrandMutation = useMutation({
    mutationFn: async (data: BrandFormValues) => {
      const { data: brand, error } = await supabase
        .from('car_brands')
        .insert([{ name: data.name }])
        .select()
        .single();
      
      if (error) throw error;
      return brand;
    },
    onSuccess: () => {
      toast({
        title: "Марка добавлена",
        description: "Новая марка автомобиля успешно добавлена.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'car-brands'] });
      setAddBrandDialogOpen(false);
      brandForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось добавить марку: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a brand
  const updateBrandMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const { data: brand, error } = await supabase
        .from('car_brands')
        .update({ name: data.name })
        .eq('id', data.id)
        .select()
        .single();
      
      if (error) throw error;
      return brand;
    },
    onSuccess: () => {
      toast({
        title: "Марка обновлена",
        description: "Марка автомобиля успешно обновлена.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'car-brands'] });
      setAddBrandDialogOpen(false);
      setSelectedBrandForEdit(null);
      brandForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить марку: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for adding a model
  const addModelMutation = useMutation({
    mutationFn: async (data: ModelFormValues) => {
      const { data: model, error } = await supabase
        .from('car_models')
        .insert([{ name: data.name, brand_id: data.brandId }])
        .select()
        .single();
      
      if (error) throw error;
      return model;
    },
    onSuccess: () => {
      toast({
        title: "Модель добавлена",
        description: "Новая модель автомобиля успешно добавлена.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'car-models', selectedBrand] });
      setAddModelDialogOpen(false);
      modelForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось добавить модель: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a model
  const updateModelMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; brandId: string }) => {
      const { data: model, error } = await supabase
        .from('car_models')
        .update({ name: data.name, brand_id: data.brandId })
        .eq('id', data.id)
        .select()
        .single();
      
      if (error) throw error;
      return model;
    },
    onSuccess: () => {
      toast({
        title: "Модель обновлена",
        description: "Модель автомобиля успешно обновлена.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'car-models', selectedBrand] });
      setAddModelDialogOpen(false);
      setSelectedModelForEdit(null);
      modelForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить модель: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for batch adding Suzuki models
  const addSuzukiModelsMutation = useMutation({
    mutationFn: async (data: { brandId: string, models: string[] }) => {
      const modelObjects = data.models.map(modelName => ({
        name: modelName,
        brand_id: data.brandId
      }));
      
      const { data: result, error } = await supabase
        .from('car_models')
        .insert(modelObjects)
        .select();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Модели Suzuki добавлены",
        description: `Успешно добавлено ${data.length} моделей Suzuki в базу данных.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'car-models', variables.brandId] });
      setIsSeedingData(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось добавить модели Suzuki: ${error.message}`,
        variant: "destructive",
      });
      setIsSeedingData(false);
    },
  });

  // Handler for submitting the brand form
  const onBrandSubmit = useCallback((data: BrandFormValues) => {
    if (selectedBrandForEdit) {
      updateBrandMutation.mutate({ id: selectedBrandForEdit, name: data.name });
    } else {
      addBrandMutation.mutate(data);
    }
  }, [selectedBrandForEdit, addBrandMutation, updateBrandMutation]);

  // Handler for submitting the model form
  const onModelSubmit = useCallback((data: ModelFormValues) => {
    if (selectedModelForEdit) {
      updateModelMutation.mutate({ id: selectedModelForEdit, name: data.name, brandId: data.brandId });
    } else {
      addModelMutation.mutate(data);
    }
  }, [selectedModelForEdit, addModelMutation, updateModelMutation]);

  // Handler for opening the brand edit dialog
  const handleEditBrand = useCallback((brandId: string) => {
    setSelectedBrandForEdit(brandId);
    setAddBrandDialogOpen(true);
  }, []);

  // Handler for opening the model edit dialog
  const handleEditModel = useCallback((modelId: string) => {
    setSelectedModelForEdit(modelId);
    setAddModelDialogOpen(true);
  }, []);

  // Function to seed Suzuki models
  const seedSuzukiModels = useCallback(async () => {
    setIsSeedingData(true);
    
    // First check if Suzuki brand exists
    let suzukiBrandId = brands.find(b => b.name.toLowerCase() === 'suzuki')?.id;
    
    if (!suzukiBrandId) {
      try {
        // Create Suzuki brand if it doesn't exist
        const { data: newBrand, error } = await supabase
          .from('car_brands')
          .insert([{ name: 'Suzuki' }])
          .select()
          .single();
        
        if (error) throw error;
        suzukiBrandId = newBrand.id;
        
        // Force refresh brands
        queryClient.invalidateQueries({ queryKey: ['admin', 'car-brands'] });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось создать марку Suzuki",
          variant: "destructive",
        });
        setIsSeedingData(false);
        return;
      }
    }
    
    // Suzuki models from different markets
    const suzukiModels = [
      // JDM (Japanese Domestic Market)
      'Jimny', 'Swift', 'Hustler', 'Spacia', 'Solio', 'Alto', 'Lapin', 'Wagon R', 'Ignis', 'Escudo',
      'Landy', 'Every', 'Carry', 'Xbee', 'Baleno', 'Kizashi', 'SX4', 'S-Cross',
      
      // European Market
      'Vitara', 'S-Presso', 'Across', 'Swace', 'Celerio', 'Splash',
      
      // Indian Market
      'Dzire', 'Ciaz', 'Ertiga', 'XL6', 'Eeco', 'Fronx', 'Grand Vitara', 'Brezza',
      
      // North American Market (Historical)
      'Equator', 'Grand Vitara XL-7', 'Sidekick', 'Samurai', 'Esteem', 'Forenza', 'Reno', 'Aerio',
      
      // Global/Special Models
      'Cappuccino', 'Hayabusa', 'Intruder', 'Katana', 'GSX-R', 'Boulevard', 'V-Strom', 'Burgman',
      'Samurai'
    ];
    
    // Add all models
    if (suzukiBrandId) {
      addSuzukiModelsMutation.mutate({
        brandId: suzukiBrandId,
        models: suzukiModels
      });
    }
    
  }, [brands, queryClient, addSuzukiModelsMutation, toast]);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Каталог автомобилей</h1>
            <p className="text-gray-500">Управление марками и моделями автомобилей</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={seedSuzukiModels} 
              disabled={isSeedingData}
              className="bg-green-50 border-green-500 text-green-600 hover:bg-green-100"
            >
              {isSeedingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка моделей Suzuki...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить модели Suzuki
                </>
              )}
            </Button>
            
            <Dialog open={addBrandDialogOpen} onOpenChange={setAddBrandDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500">
                  <Plus className="mr-2 h-4 w-4" /> Добавить марку
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedBrandForEdit ? "Редактировать марку" : "Добавить новую марку"}</DialogTitle>
                  <DialogDescription>
                    {selectedBrandForEdit ? "Измените название марки автомобиля" : "Введите название новой марки автомобиля"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...brandForm}>
                  <form onSubmit={brandForm.handleSubmit(onBrandSubmit)} className="space-y-6">
                    <FormField
                      control={brandForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название марки</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Например: BMW, Mercedes, Toyota" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAddBrandDialogOpen(false);
                          setSelectedBrandForEdit(null);
                          brandForm.reset();
                        }}
                      >
                        Отмена
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                        disabled={addBrandMutation.isPending || updateBrandMutation.isPending}
                      >
                        {(addBrandMutation.isPending || updateBrandMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {selectedBrandForEdit ? "Сохранить" : "Добавить"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={addModelDialogOpen} onOpenChange={setAddModelDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500">
                  <Plus className="mr-2 h-4 w-4" /> Добавить модель
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedModelForEdit ? "Редактировать модель" : "Добавить новую модель"}</DialogTitle>
                  <DialogDescription>
                    {selectedModelForEdit ? "Измените данные модели автомобиля" : "Выберите марку и введите название новой модели"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...modelForm}>
                  <form onSubmit={modelForm.handleSubmit(onModelSubmit)} className="space-y-6">
                    <FormField
                      control={modelForm.control}
                      name="brandId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Марка</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isLoadingCarData}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите марку" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
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
                            <Input 
                              placeholder="Например: X5, E-Class, Corolla" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAddModelDialogOpen(false);
                          setSelectedModelForEdit(null);
                          modelForm.reset();
                        }}
                      >
                        Отмена
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                        disabled={addModelMutation.isPending || updateModelMutation.isPending}
                      >
                        {(addModelMutation.isPending || updateModelMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {selectedModelForEdit ? "Сохранить" : "Добавить"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Brands card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Марки автомобилей</CardTitle>
                <span className="text-sm text-gray-500">{brands.length} марок</span>
              </div>
              <Input
                placeholder="Поиск марки..."
                className="mt-2"
                value={searchBrandTerm}
                onChange={(e) => setSearchBrandTerm(e.target.value)}
              />
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead className="w-24 text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCarData ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Загрузка...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredBrands.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          <div className="flex flex-col justify-center items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-gray-400" />
                            <span>Марки не найдены</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBrands.map((brand) => (
                        <TableRow key={brand.id}>
                          <TableCell className="font-medium">{brand.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditBrand(brand.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Models card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Модели автомобилей</CardTitle>
                <span className="text-sm text-gray-500">
                  {selectedBrand ? 
                    `${brandModels.length} моделей для выбранной марки` : 
                    'Выберите марку'
                  }
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <Select
                  value={selectedBrand || ""}
                  onValueChange={(value) => {
                    selectBrand(value);
                    setSearchModelTerm("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите марку для просмотра моделей" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBrand && (
                  <Input
                    placeholder="Поиск модели..."
                    value={searchModelTerm}
                    onChange={(e) => setSearchModelTerm(e.target.value)}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead className="w-24 text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedBrand ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          <div className="flex flex-col justify-center items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-gray-400" />
                            <span>Выберите марку для просмотра моделей</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : isLoadingCarData ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Загрузка...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredModels.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          <div className="flex flex-col justify-center items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-gray-400" />
                            <span>Модели не найдены</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredModels.map((model) => (
                        <TableRow key={model.id}>
                          <TableCell className="font-medium">{model.name}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditModel(model.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCarCatalog;
