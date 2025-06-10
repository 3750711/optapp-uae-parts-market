import React, { useState, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Loader2, Plus, Pencil, AlertCircle, Trash2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAllCarBrands } from "@/hooks/useAllCarBrands";
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
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  // Используем новый хук для загрузки всех данных
  const { 
    brands, 
    brandModels, 
    selectedBrand,
    selectBrand,
    isLoading: isLoadingCarData,
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm,
    totalBrands,
    totalModels,
    filteredBrandsCount,
    filteredModelsCount
  } = useAllCarBrands();

  // Filter brands based on search term
  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
  );

  // Filter models based on search term and selected brand
  const filteredModels = brandModels.filter(model => 
    model.name.toLowerCase().includes(modelSearchTerm.toLowerCase())
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

  // Helper function to handle database errors
  const handleDatabaseError = (error: any, entityType: 'марку' | 'модель') => {
    console.error(`Error with ${entityType}:`, error);
    
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      return `${entityType === 'марку' ? 'Марка' : 'Модель'} с таким названием уже существует`;
    }
    
    if (error.code === '23503') {
      return `Ошибка связи с базой данных. Проверьте правильность данных`;
    }
    
    return `Не удалось ${entityType === 'марку' ? 'добавить марку' : 'добавить модель'}: ${error.message}`;
  };

  // Mutation for adding a brand
  const addBrandMutation = useMutation({
    mutationFn: async (data: BrandFormValues) => {
      // Check if brand already exists (case-insensitive)
      const { data: existingBrand } = await supabase
        .from('car_brands')
        .select('id')
        .ilike('name', data.name)
        .single();
      
      if (existingBrand) {
        throw new Error('Марка с таким названием уже существует');
      }
      
      const { data: brand, error } = await supabase
        .from('car_brands')
        .insert([{ name: data.name.trim() }])
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
      const errorMessage = handleDatabaseError(error, 'марку');
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a brand
  const updateBrandMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      // Check if another brand with this name exists (excluding current one)
      const { data: existingBrand } = await supabase
        .from('car_brands')
        .select('id')
        .ilike('name', data.name)
        .neq('id', data.id)
        .single();
      
      if (existingBrand) {
        throw new Error('Марка с таким названием уже существует');
      }
      
      const { data: brand, error } = await supabase
        .from('car_brands')
        .update({ name: data.name.trim() })
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
      const errorMessage = handleDatabaseError(error, 'марку');
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a brand and its models
  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId: string) => {
      // First delete all models associated with this brand
      const { error: modelsError } = await supabase
        .from('car_models')
        .delete()
        .eq('brand_id', brandId);

      if (modelsError) throw modelsError;

      // Then delete the brand itself
      const { error: brandError } = await supabase
        .from('car_brands')
        .delete()
        .eq('id', brandId);

      if (brandError) throw brandError;

      return brandId;
    },
    onSuccess: (brandId) => {
      toast({
        title: "Марка удалена",
        description: "Марка автомобиля и все связанные модели успешно удалены.",
      });
      
      // Clear selection if the deleted brand was selected
      if (selectedBrand === brandId) {
        selectBrand("");
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'car-brands'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'car-models'] });
      setIsDeleteAlertOpen(false);
      setBrandToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить марку: ${error.message}`,
        variant: "destructive",
      });
      setIsDeleteAlertOpen(false);
    },
  });

  // Mutation for adding a model
  const addModelMutation = useMutation({
    mutationFn: async (data: ModelFormValues) => {
      // Check if model already exists for this brand (case-insensitive)
      const { data: existingModel } = await supabase
        .from('car_models')
        .select('id')
        .eq('brand_id', data.brandId)
        .ilike('name', data.name)
        .single();
      
      if (existingModel) {
        throw new Error('Модель с таким названием уже существует для данной марки');
      }
      
      const { data: model, error } = await supabase
        .from('car_models')
        .insert([{ name: data.name.trim(), brand_id: data.brandId }])
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
      const errorMessage = handleDatabaseError(error, 'модель');
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a model
  const updateModelMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; brandId: string }) => {
      // Check if another model with this name exists for this brand (excluding current one)
      const { data: existingModel } = await supabase
        .from('car_models')
        .select('id')
        .eq('brand_id', data.brandId)
        .ilike('name', data.name)
        .neq('id', data.id)
        .single();
      
      if (existingModel) {
        throw new Error('Модель с таким названием уже существует для данной марки');
      }
      
      const { data: model, error } = await supabase
        .from('car_models')
        .update({ name: data.name.trim(), brand_id: data.brandId })
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
      const errorMessage = handleDatabaseError(error, 'модель');
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
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

  // Handler for opening the delete brand dialog
  const handleOpenDeleteBrand = useCallback((brandId: string) => {
    setBrandToDelete(brandId);
    setIsDeleteAlertOpen(true);
  }, []);

  // Handler for confirming brand deletion
  const handleConfirmDeleteBrand = useCallback(() => {
    if (brandToDelete) {
      deleteBrandMutation.mutate(brandToDelete);
    }
  }, [brandToDelete, deleteBrandMutation]);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Каталог автомобилей</h1>
            <p className="text-gray-500">
              Управление марками и моделями автомобилей
              {totalBrands > 0 && (
                <span className="ml-2 text-sm">
                  (Всего: {totalBrands} марок)
                </span>
              )}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
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

        {/* Alert Dialog for brand deletion */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы собираетесь удалить марку автомобиля. 
                Это действие также удалит ВСЕ модели, связанные с этой маркой. 
                Это действие не может быть отменено.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBrandToDelete(null)}>Отмена</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDeleteBrand}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {deleteBrandMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Brands card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Марки автомобилей</CardTitle>
                <span className="text-sm text-gray-500">
                  {filteredBrandsCount !== totalBrands 
                    ? `${filteredBrandsCount} из ${totalBrands}` 
                    : `${totalBrands} марок`
                  }
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск марки..."
                  className="pl-10"
                  value={brandSearchTerm}
                  onChange={(e) => setBrandSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead className="w-32 text-right">Действия</TableHead>
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
                    ) : brands.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          <div className="flex flex-col justify-center items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-gray-400" />
                            <span>
                              {brandSearchTerm ? 'Марки не найдены по запросу' : 'Марки не найдены'}
                            </span>
                            {brandSearchTerm && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setBrandSearchTerm('')}
                              >
                                Очистить поиск
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      brands.map((brand) => (
                        <TableRow key={brand.id}>
                          <TableCell className="font-medium">{brand.name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditBrand(brand.id)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                onClick={() => handleOpenDeleteBrand(brand.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                  {selectedBrand ? (
                    filteredModelsCount !== totalModels 
                      ? `${filteredModelsCount} из ${totalModels}` 
                      : `${totalModels} моделей`
                  ) : 'Выберите марку'}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <Select
                  value={selectedBrand || ""}
                  onValueChange={(value) => {
                    selectBrand(value);
                    setModelSearchTerm("");
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Поиск модели..."
                      className="pl-10"
                      value={modelSearchTerm}
                      onChange={(e) => setModelSearchTerm(e.target.value)}
                    />
                  </div>
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
                    ) : brandModels.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          <div className="flex flex-col justify-center items-center gap-2">
                            <AlertCircle className="h-6 w-6 text-gray-400" />
                            <span>
                              {modelSearchTerm ? 'Модели не найдены по запросу' : 'Модели не найдены'}
                            </span>
                            {modelSearchTerm && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setModelSearchTerm('')}
                              >
                                Очистить поиск
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      brandModels.map((model) => (
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

</edits_to_apply>
