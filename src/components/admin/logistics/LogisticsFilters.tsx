import { useState } from 'react';
import { Search, X, Users, User, Package, Box, Ship, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LogisticsFilters as LogisticsFiltersType, FilterOption, FilterStats } from '@/types/logisticsFilters';
import { FilterPopoverContent } from './FilterPopoverContent';
import { SHIPMENT_STATUS_OPTIONS, CONTAINER_STATUS_OPTIONS, ORDER_STATUS_OPTIONS } from './filterConstants';

interface LogisticsFiltersProps {
  pendingFilters: LogisticsFiltersType;
  appliedFilters: LogisticsFiltersType;
  onPendingFiltersChange: (filters: LogisticsFiltersType) => void;
  onApplyFilters: () => void;
  onRemoveFilter: (key: keyof LogisticsFiltersType, value: string) => void;
  onClearFilters: () => void;
  sellers: FilterOption[];
  buyers: FilterOption[];
  containers: FilterOption[];
  stats: FilterStats;
  hasUnappliedChanges: boolean;
}

export const LogisticsFilters: React.FC<LogisticsFiltersProps> = ({
  pendingFilters,
  appliedFilters,
  onPendingFiltersChange,
  onApplyFilters,
  onRemoveFilter,
  onClearFilters,
  sellers,
  buyers,
  containers,
  stats,
  hasUnappliedChanges
}) => {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Функция для добавления/удаления значения из массива фильтров (работает с pending)
  const toggleFilter = (key: keyof LogisticsFiltersType, value: string) => {
    const currentValues = pendingFilters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onPendingFiltersChange({ ...pendingFilters, [key]: newValues });
  };

  // Очистить все фильтры - делегируем родителю
  const clearAllFilters = () => {
    onClearFilters();
  };

  // Удалить конкретный фильтр - делегируем родителю
  const removeFilter = (key: keyof LogisticsFiltersType, value: string) => {
    onRemoveFilter(key, value);
  };

  // Проверка, есть ли активные примененные фильтры
  const hasActiveFilters = 
    appliedFilters.sellerIds.length > 0 ||
    appliedFilters.buyerIds.length > 0 ||
    appliedFilters.containerNumbers.length > 0 ||
    appliedFilters.shipmentStatuses.length > 0 ||
    appliedFilters.containerStatuses.length > 0 ||
    appliedFilters.orderStatuses.length > 0 ||
    appliedFilters.searchTerm.length > 0;

  // Функции для получения label по value
  const getSellerLabel = (id: string) => sellers.find(s => s.value === id)?.label || id;
  const getBuyerLabel = (id: string) => buyers.find(b => b.value === id)?.label || id;
  const getContainerLabel = (num: string) => containers.find(c => c.value === num)?.label || num;
  const getShipmentStatusLabel = (status: string) => SHIPMENT_STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  const getContainerStatusLabel = (status: string) => CONTAINER_STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  const getOrderStatusLabel = (status: string) => ORDER_STATUS_OPTIONS.find(s => s.value === status)?.label || status;

  // Индикатор загрузки поиска
  const isSearching = pendingFilters.searchTerm !== appliedFilters.searchTerm;

  return (
    <div className="space-y-4 mb-6">
      {/* 1. ПОИСК, КНОПКА ПРИМЕНИТЬ И ОЧИСТКА */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по номеру заказа или названию товара..."
            value={pendingFilters.searchTerm}
            onChange={(e) => onPendingFiltersChange({ ...pendingFilters, searchTerm: e.target.value })}
            className="pl-9 pr-9"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {/* КНОПКА "ПРИМЕНИТЬ ФИЛЬТРЫ" */}
        <Button 
          onClick={onApplyFilters}
          disabled={!hasUnappliedChanges}
          variant={hasUnappliedChanges ? "default" : "outline"}
          className={hasUnappliedChanges ? "bg-primary hover:bg-primary/90" : ""}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Применить фильтры
          {hasUnappliedChanges && (
            <Badge variant="secondary" className="ml-2 bg-orange-500 text-white">
              !
            </Badge>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-2" />
            Очистить все
          </Button>
        )}
      </div>

      {/* 2. АКТИВНЫЕ ФИЛЬТРЫ (BADGES) - показываем appliedFilters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Активные фильтры:</span>
          
          {/* Продавцы */}
          {appliedFilters.sellerIds.map(sellerId => (
            <Badge key={sellerId} variant="secondary" className="gap-1">
              👥 {getSellerLabel(sellerId)}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeFilter('sellerIds', sellerId)}
              />
            </Badge>
          ))}

          {/* Покупатели */}
          {appliedFilters.buyerIds.map(buyerId => (
            <Badge key={buyerId} variant="secondary" className="gap-1">
              👤 {getBuyerLabel(buyerId)}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeFilter('buyerIds', buyerId)}
              />
            </Badge>
          ))}

          {/* Статусы отгрузки */}
          {appliedFilters.shipmentStatuses.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              {getShipmentStatusLabel(status)}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeFilter('shipmentStatuses', status)}
              />
            </Badge>
          ))}

          {/* Контейнеры */}
          {appliedFilters.containerNumbers.map(containerNum => (
            <Badge key={containerNum} variant="secondary" className="gap-1">
              📦 {getContainerLabel(containerNum)}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeFilter('containerNumbers', containerNum)}
              />
            </Badge>
          ))}

          {/* Статусы контейнеров */}
          {appliedFilters.containerStatuses.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              🚢 {getContainerStatusLabel(status)}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeFilter('containerStatuses', status)}
              />
            </Badge>
          ))}

          {/* Статусы заказов */}
          {appliedFilters.orderStatuses.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              📋 {getOrderStatusLabel(status)}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => removeFilter('orderStatuses', status)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* 3. КНОПКИ ФИЛЬТРОВ (POPOVERS) */}
      <div className="flex flex-wrap gap-2">
        {/* Продавцы */}
        <Popover open={openPopover === 'sellers'} onOpenChange={(open) => setOpenPopover(open ? 'sellers' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Продавцы
              {pendingFilters.sellerIds.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingFilters.sellerIds.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <FilterPopoverContent
              title="Продавцы"
              options={sellers}
              selectedValues={pendingFilters.sellerIds}
              onToggle={(value) => toggleFilter('sellerIds', value)}
            />
          </PopoverContent>
        </Popover>

        {/* Покупатели */}
        <Popover open={openPopover === 'buyers'} onOpenChange={(open) => setOpenPopover(open ? 'buyers' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Покупатели
              {pendingFilters.buyerIds.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingFilters.buyerIds.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <FilterPopoverContent
              title="Покупатели"
              options={buyers}
              selectedValues={pendingFilters.buyerIds}
              onToggle={(value) => toggleFilter('buyerIds', value)}
            />
          </PopoverContent>
        </Popover>

        {/* Статус отгрузки */}
        <Popover open={openPopover === 'shipmentStatus'} onOpenChange={(open) => setOpenPopover(open ? 'shipmentStatus' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Package className="h-4 w-4 mr-2" />
              Статус отгрузки
              {pendingFilters.shipmentStatuses.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingFilters.shipmentStatuses.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <FilterPopoverContent
              title="Статус отгрузки"
              options={SHIPMENT_STATUS_OPTIONS}
              selectedValues={pendingFilters.shipmentStatuses}
              onToggle={(value) => toggleFilter('shipmentStatuses', value)}
            />
          </PopoverContent>
        </Popover>

        {/* Контейнеры */}
        <Popover open={openPopover === 'containers'} onOpenChange={(open) => setOpenPopover(open ? 'containers' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Box className="h-4 w-4 mr-2" />
              Контейнеры
              {pendingFilters.containerNumbers.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingFilters.containerNumbers.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <FilterPopoverContent
              title="Контейнеры"
              options={containers}
              selectedValues={pendingFilters.containerNumbers}
              onToggle={(value) => toggleFilter('containerNumbers', value)}
            />
          </PopoverContent>
        </Popover>

        {/* Статус контейнера */}
        <Popover open={openPopover === 'containerStatus'} onOpenChange={(open) => setOpenPopover(open ? 'containerStatus' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Ship className="h-4 w-4 mr-2" />
              Статус контейнера
              {pendingFilters.containerStatuses.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingFilters.containerStatuses.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <FilterPopoverContent
              title="Статус контейнера"
              options={CONTAINER_STATUS_OPTIONS}
              selectedValues={pendingFilters.containerStatuses}
              onToggle={(value) => toggleFilter('containerStatuses', value)}
            />
          </PopoverContent>
        </Popover>

        {/* Статус заказа */}
        <Popover open={openPopover === 'orderStatus'} onOpenChange={(open) => setOpenPopover(open ? 'orderStatus' : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Статус заказа
              {pendingFilters.orderStatuses.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingFilters.orderStatuses.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <FilterPopoverContent
              title="Статус заказа"
              options={ORDER_STATUS_OPTIONS}
              selectedValues={pendingFilters.orderStatuses}
              onToggle={(value) => toggleFilter('orderStatuses', value)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 4. СТАТИСТИКА ФИЛЬТРАЦИИ */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Показано</div>
              <div className="text-2xl font-bold">
                {stats.filteredOrders}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  из {stats.totalOrders}
                </span>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Не отправлено</div>
              <div className="text-xl font-semibold text-red-600">
                {stats.notShipped}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Частично</div>
              <div className="text-xl font-semibold text-orange-600">
                {stats.partiallyShipped}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Отправлено</div>
              <div className="text-xl font-semibold text-green-600">
                {stats.inTransit}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Сумма доставки</div>
              <div className="text-xl font-semibold">
                ${stats.totalDeliveryPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
