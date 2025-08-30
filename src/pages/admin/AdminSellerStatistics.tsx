import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Download, TrendingUp, Users, Package, ShoppingCart } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import AdminLayout from '@/components/admin/AdminLayout';
import { useSellerStatistics } from '@/hooks/useSellerStatistics';
import { useIsMobile } from '@/hooks/use-mobile';
import * as XLSX from 'xlsx';

const AdminSellerStatistics = () => {
  const isMobile = useIsMobile();
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: statistics, isLoading, error } = useSellerStatistics({
    startDate,
    endDate
  });

  const handleExportToExcel = () => {
    if (!statistics || statistics.length === 0) return;

    const exportData = statistics.map(stat => ({
      'Дата': format(new Date(stat.date), 'dd.MM.yyyy'),
      'Продавец': stat.seller_name || 'Не указано',
      'OPT ID': stat.opt_id || 'Не указано',
      'Объявления': stat.products_created,
      'Заказы': stat.orders_created,
      'Сумма заказов': stat.total_order_value,
      'Средний чек': stat.avg_order_value
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Статистика продавцов');
    
    const fileName = `seller-statistics-${format(startDate, 'dd-MM-yyyy')}-to-${format(endDate, 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Calculate summary statistics
  const totalProductsCreated = statistics?.reduce((sum, stat) => sum + stat.products_created, 0) || 0;
  const totalOrdersCreated = statistics?.reduce((sum, stat) => sum + stat.orders_created, 0) || 0;
  const totalOrderValue = statistics?.reduce((sum, stat) => sum + stat.total_order_value, 0) || 0;
  const activeSellers = new Set(statistics?.map(stat => stat.seller_id) || []).size;

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">Ошибка загрузки статистики: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-2xl font-bold">Статистика продавцов</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd.MM.yyyy") : "Дата начала"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd.MM.yyyy") : "Дата окончания"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button onClick={handleExportToExcel} disabled={!statistics || statistics.length === 0}>
                  <Download className="mr-2 h-4 w-4" />
                  Экспорт Excel
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Активные продавцы</p>
                      <p className="text-2xl font-bold">{activeSellers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Объявлений создано</p>
                      <p className="text-2xl font-bold">{totalProductsCreated}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Заказов оформлено</p>
                      <p className="text-2xl font-bold">{totalOrdersCreated}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Общая сумма</p>
                      <p className="text-2xl font-bold">${totalOrderValue.toFixed(0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : !statistics || statistics.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Нет данных за выбранный период</p>
              </div>
            ) : isMobile ? (
              <div className="space-y-4">
                {statistics.map((stat, index) => (
                  <Card key={`${stat.seller_id}-${stat.date}-${index}`}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{stat.seller_name || 'Не указано'}</p>
                            <p className="text-sm text-muted-foreground">{format(new Date(stat.date), 'dd.MM.yyyy')}</p>
                          </div>
                          {stat.opt_id && (
                            <Badge variant="outline">{stat.opt_id}</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Объявления:</span>
                            <span className="ml-2 font-medium">{stat.products_created}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Заказы:</span>
                            <span className="ml-2 font-medium">{stat.orders_created}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Сумма:</span>
                            <span className="ml-2 font-medium">${stat.total_order_value.toFixed(0)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Средний чек:</span>
                            <span className="ml-2 font-medium">${stat.avg_order_value.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Продавец</TableHead>
                      <TableHead>OPT ID</TableHead>
                      <TableHead className="text-right">Объявления</TableHead>
                      <TableHead className="text-right">Заказы</TableHead>
                      <TableHead className="text-right">Сумма заказов</TableHead>
                      <TableHead className="text-right">Средний чек</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.map((stat, index) => (
                      <TableRow key={`${stat.seller_id}-${stat.date}-${index}`}>
                        <TableCell>{format(new Date(stat.date), 'dd.MM.yyyy')}</TableCell>
                        <TableCell className="font-medium">{stat.seller_name || 'Не указано'}</TableCell>
                        <TableCell>
                          {stat.opt_id ? (
                            <Badge variant="outline">{stat.opt_id}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Не указано</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{stat.products_created}</TableCell>
                        <TableCell className="text-right">{stat.orders_created}</TableCell>
                        <TableCell className="text-right">${stat.total_order_value.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${stat.avg_order_value.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSellerStatistics;