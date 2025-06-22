import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SimpleAuthContext';

const SellerSellProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [productId, setProductId] = useState('');
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get('productId');

  useEffect(() => {
    if (initialProductId) {
      setProductId(initialProductId);
    }
  }, [initialProductId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Вы должны быть авторизованы для продажи товара');
      return;
    }

    if (!title || !description || !price) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            title,
            description,
            price: parseFloat(price),
            seller_id: user.id,
            seller_name: user.email,
            status: 'active',
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      toast({
        title: "Товар добавлен на продажу",
        description: "Ваш товар успешно добавлен и доступен для покупки",
      });
      navigate(`/product/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Не удалось добавить товар на продажу');
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар на продажу",
        variant: "destructive",
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
            <CardTitle className="text-2xl">Продать свой товар</CardTitle>
            <CardDescription>
              Заполните информацию о товаре, который вы хотите продать
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>Товар успешно добавлен на продажу!</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Название товара</Label>
                <Input
                  id="title"
                  placeholder="Например: Новый iPhone 13 Pro Max"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание товара</Label>
                <Textarea
                  id="description"
                  placeholder="Укажите все особенности и характеристики товара"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Цена товара</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Укажите цену в рублях"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Добавление товара...' : 'Добавить товар на продажу'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SellerSellProduct;
