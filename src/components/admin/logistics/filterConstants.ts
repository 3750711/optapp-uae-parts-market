import { FilterOption } from '@/types/logisticsFilters';

export const SHIPMENT_STATUS_OPTIONS: FilterOption[] = [
  { value: 'not_shipped', label: '🔴 Не отправлен' },
  { value: 'partially_shipped', label: '🟠 Частично отправлен' },
  { value: 'in_transit', label: '🟢 Отправлен' },
];

export const CONTAINER_STATUS_OPTIONS: FilterOption[] = [
  { value: 'waiting', label: 'Ожидание' },
  { value: 'sent_from_uae', label: 'Отправлен из ОАЭ' },
  { value: 'iran_transit', label: 'Транзит Иран' },
  { value: 'customs', label: 'Таможня' },
  { value: 'customs_out', label: 'Вышел с таможни' },
  { value: 'customs_holding', label: 'Таможня - удержание' },
  { value: 'terminal', label: 'Терминал' },
  { value: 'transit_to_warehouse', label: 'В пути на склад' },
  { value: 'received', label: 'Получен' },
  { value: 'delivered', label: 'Доставлен' },
];

export const ORDER_STATUS_OPTIONS: FilterOption[] = [
  { value: 'created', label: 'Создан' },
  { value: 'paid', label: 'Оплачен' },
  { value: 'in_process', label: 'В обработке' },
  { value: 'shipped', label: 'Отправлен' },
  { value: 'delivered', label: 'Доставлен' },
  { value: 'cancelled', label: 'Отменен' },
];
