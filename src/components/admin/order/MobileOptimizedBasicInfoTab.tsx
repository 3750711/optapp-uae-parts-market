
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from '@/hooks/use-mobile';
import { Package, User, Truck, DollarSign, Calendar } from "lucide-react";

interface MobileOptimizedBasicInfoTabProps {
  form: any;
  order: any;
}

export const MobileOptimizedBasicInfoTab: React.FC<MobileOptimizedBasicInfoTabProps> = ({
  form,
  order
}) => {
  const isMobile = useIsMobile();

  const statusOptions = [
    { value: 'created', label: 'Создан', color: 'bg-blue-100 text-blue-800' },
    { value: 'confirmed', label: 'Подтвержден', color: 'bg-green-100 text-green-800' },
    { value: 'in_progress', label: 'В работе', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'delivered', label: 'Доставлен', color: 'bg-purple-100 text-purple-800' },
    { value: 'completed', label: 'Завершен', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'cancelled', label: 'Отменен', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className={`space-y-4 ${isMobile ? 'px-1' : ''}`}>
      {/* Статус заказа */}
      <Card>
        <CardHeader className={isMobile ? 'pb-3' : ''}>
          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Package className="h-5 w-5" />
            Статус заказа
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'pt-0' : ''}>
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Текущий статус</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={isMobile ? 'h-12' : ''}>
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <Badge className={`${status.color} text-xs`}>
                            {status.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Информация о товаре */}
      <Card>
        <CardHeader className={isMobile ? 'pb-3' : ''}>
          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Package className="h-5 w-5" />
            Информация о товаре
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'pt-0' : ''} space-y-4`}>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название товара</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Введите название товара"
                    className={isMobile ? 'h-12 text-base' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Бренд</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Бренд"
                      className={isMobile ? 'h-12 text-base' : ''}
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
                      {...field} 
                      placeholder="Модель"
                      className={isMobile ? 'h-12 text-base' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="text_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание заказа</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Дополнительная информация о заказе"
                    rows={isMobile ? 4 : 3}
                    className={isMobile ? 'text-base resize-none' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Цена и доставка */}
      <Card>
        <CardHeader className={isMobile ? 'pb-3' : ''}>
          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <DollarSign className="h-5 w-5" />
            Цена и доставка
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'pt-0' : ''} space-y-4`}>
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Цена товара ($)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={isMobile ? 'h-12 text-base' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delivery_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Стоимость доставки ($)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className={isMobile ? 'h-12 text-base' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-4'}`}>
            <FormField
              control={form.control}
              name="delivery_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Способ доставки</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={isMobile ? 'h-12' : ''}>
                        <SelectValue placeholder="Выберите способ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="self_pickup">📦 Самовывоз</SelectItem>
                      <SelectItem value="cargo_rf">🚛 Cargo РФ</SelectItem>
                      <SelectItem value="cargo_kz">🚚 Cargo КЗ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="place_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Количество мест</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      placeholder="1"
                      className={isMobile ? 'h-12 text-base' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Участники */}
      <Card>
        <CardHeader className={isMobile ? 'pb-3' : ''}>
          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <User className="h-5 w-5" />
            Участники заказа
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'pt-0' : ''} space-y-4`}>
          {order?.buyer && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-800">Покупатель</div>
                  <div className="text-sm text-green-700">{order.buyer.full_name}</div>
                  {order.buyer.opt_id && (
                    <div className="text-xs text-green-600">OPT ID: {order.buyer.opt_id}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {order?.seller && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-800">Продавец</div>
                  <div className="text-sm text-blue-700">{order.seller.full_name}</div>
                  {order.seller.opt_id && (
                    <div className="text-xs text-blue-600">OPT ID: {order.seller.opt_id}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
