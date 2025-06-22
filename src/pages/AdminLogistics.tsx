import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/SimpleAuthContext';

const AdminLogistics = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const { user } = useAuth();

  const { data: logistics, isLoading, error, refetch } = useQuery(
    ['logistics', searchTerm, filterStatus],
    async () => {
      let query = supabase
        .from('logistics')
        .select('*');

      if (searchTerm) {
        query = query.ilike('tracking_number', `%${searchTerm}%`);
      }

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  );

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // Logic to create a new logistics entry
      toast({
        title: "Успех",
        description: "Новая запись логистики создана.",
      });
    } catch (error) {
      console.error("Error creating logistics:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать запись логистики.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('logistics')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Успех",
        description: "Статус логистики обновлен.",
      });
      refetch();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус логистики.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    refetch();
    toast({
      title: "Обновление данных",
      description: "Загружаем актуальную информацию о логистике...",
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Управление логистикой</CardTitle>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Фильтр
                </Button>
                <Button size="sm" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Обновить
                </Button>
              </div>
            </div>
            <CardDescription>Отслеживайте и управляйте логистикой заказов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                type="text"
                placeholder="Поиск по номеру отслеживания..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? (
                  <>
                    Создание...
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать запись
                  </>
                )}
              </Button>
            </div>

            {isFilterOpen && (
              <div className="mb-4 p-4 rounded-md bg-gray-100">
                <h4 className="mb-2 font-semibold">Фильтр по статусу:</h4>
                <div className="flex space-x-2">
                  <Button
                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                  >
                    Ожидает
                  </Button>
                  <Button
                    variant={filterStatus === 'in_transit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('in_transit')}
                  >
                    В пути
                  </Button>
                  <Button
                    variant={filterStatus === 'delivered' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('delivered')}
                  >
                    Доставлено
                  </Button>
                  <Button
                    variant={filterStatus === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('')}
                  >
                    Сбросить
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Не удалось загрузить данные о логистике.
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <p>Загрузка...</p>
            ) : logistics && logistics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Номер отслеживания
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Адрес доставки
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата отправки
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Стоимость доставки
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logistics.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.tracking_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              item.status === 'delivered'
                                ? 'success'
                                : item.status === 'in_transit'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.delivery_address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.shipping_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.delivery_price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                          >
                            <option value="pending">Ожидает</option>
                            <option value="in_transit">В пути</option>
                            <option value="delivered">Доставлено</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Нет данных о логистике.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLogistics;
