
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreateRequest: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [vinCode, setVinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  
  const { 
    brands, 
    brandModels, 
    selectedBrand, 
    selectBrand,
    isLoading 
  } = useCarBrandsAndModels();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Войдите в свой аккаунт",
        description: "Для создания запроса необходимо авторизоваться",
        variant: "destructive"
      });
      return;
    }
    
    if (!title || !selectedBrand) {
      toast({
        title: "Заполните все поля",
        description: "Название запроса и марка автомобиля обязательны для заполнения",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get the brand and model names from their IDs
      const brandName = brands.find(b => b.id === selectedBrand)?.name || "";
      const modelName = selectedModel 
        ? brandModels.find(m => m.id === selectedModel)?.name || "" 
        : "";
      
      const { data, error } = await supabase
        .from('requests')
        .insert([
          {
            title,
            description,
            status: 'pending',
            user_id: user.id,
            user_name: user.email,
            brand: brandName,
            model: modelName,
            vin: vinCode || null,
          },
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // Store request id and flag for showing processing animation
      sessionStorage.setItem('fromRequestCreate', 'true');
      sessionStorage.setItem('createdRequestId', data.id);
      
      // Navigate back to requests list
      navigate('/requests');
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать запрос. Пожалуйста, попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Создание запроса</CardTitle>
            <CardDescription>
              Опишите запчасть, которую вы ищете, и получите предложения от продавцов
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название запроса</Label>
                <Input
                  id="title"
                  placeholder="Например: Передний бампер для Toyota Camry 2020"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Марка автомобиля</Label>
                <Select
                  value={selectedBrand || ""}
                  onValueChange={selectBrand}
                  disabled={isLoading}
                >
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Выберите марку автомобиля" />
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

              <div className="space-y-2">
                <Label htmlFor="model">Модель автомобиля</Label>
                <Select 
                  value={selectedModel} 
                  onValueChange={setSelectedModel}
                  disabled={!selectedBrand || brandModels.length === 0}
                >
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Выберите модель автомобиля" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vin">VIN номер (не обязательно)</Label>
                <Input
                  id="vin"
                  placeholder="Введите VIN номер автомобиля"
                  value={vinCode}
                  onChange={(e) => setVinCode(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Дополнительная информация</Label>
                <Textarea
                  id="description"
                  placeholder="Укажите все, что может быть важным: год выпуска, оригинальная/аналог, состояние, цвет, и т.д."
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !title || !selectedBrand}
              >
                {isSubmitting ? "Создание запроса..." : "Отправить запрос"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateRequest;
