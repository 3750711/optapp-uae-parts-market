import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  MoreVertical,
  Package,
  AlertCircle
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const SellerListingsContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['seller-listings', user?.id, searchTerm, selectedStatus, currentPage],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query.range(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage - 1
      );

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Активный', variant: 'default' as const },
      pending: { label: 'На модерации', variant: 'secondary' as const },
      sold: { label: 'Продан', variant: 'outline' as const },
      archived: { label: 'Архив', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: status, variant: 'outline' as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleProductAction = async (productId: string, action: string) => {
    try {
      switch (action) {
        case 'edit':
          navigate(`/seller/products/${productId}/edit`);
          break;
        case 'view':
          navigate(`/product/${productId}`);
          break;
        case 'archive':
          await supabase
            .from('products')
            .update({ status: 'archived' })
            .eq('id', productId);
          
          queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
          toast({ title: "Товар архивирован" });
          break;
        case 'activate':
          await supabase
            .from('products')
            .update({ status: 'active' })
            .eq('id', productId);
          
          queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
          toast({ title: "Товар активирован" });
          break;
      }
    } catch (error) {
      toast({ 
        title: "Ошибка", 
        description: "Не удалось выполнить действие",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ошибка загрузки</h3>
          <p className="text-gray-600 mb-4">Не удалось загрузить ваши объявления</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['seller-listings'] })}>
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Мои объявления</h2>
          <p className="text-gray-600">Управляйте своими товарами</p>
        </div>
        <Button asChild>
          <Link to="/seller/add-product">
            <Plus className="h-4 w-4 mr-2" />
            Добавить товар
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                ref={searchInputRef}
                placeholder="Поиск по названию, бренду или модели..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="pending">На модерации</SelectItem>
                <SelectItem value="sold">Проданные</SelectItem>
                <SelectItem value="archived">Архивные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет объявлений</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedStatus !== 'all' 
                ? 'По вашему запросу ничего не найдено' 
                : 'Вы еще не создали ни одного объявления'}
            </p>
            <Button asChild>
              <Link to="/seller/add-product">Создать первое объявление</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{product.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {product.brand} {product.model} • {product.year}
                    </p>
                    {product.price && (
                      <p className="text-lg font-bold text-primary mt-2">
                        {product.price.toLocaleString()} ₽
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleProductAction(product.id, 'view')}>
                        <Eye className="h-4 w-4 mr-2" />
                        Посмотреть
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleProductAction(product.id, 'edit')}>
                        <Edit className="h-4 w-4 mr-2" />
                        Редактировать
                      </DropdownMenuItem>
                      {product.status === 'active' ? (
                        <DropdownMenuItem onClick={() => handleProductAction(product.id, 'archive')}>
                          Архивировать
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleProductAction(product.id, 'activate')}>
                          Активировать
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  {getStatusBadge(product.status)}
                  <span className="text-sm text-gray-500">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerListingsContent;
