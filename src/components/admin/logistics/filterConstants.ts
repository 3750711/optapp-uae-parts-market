import { FilterOption } from '@/types/logisticsFilters';

export const SHIPMENT_STATUS_OPTIONS: FilterOption[] = [
  { value: 'not_shipped', label: '🔴 Не отправлен' },
  { value: 'partially_shipped', label: '🟠 Частично отправлен' },
  { value: 'in_transit', label: '🟢 Отправлен' },
];

export const CONTAINER_STATUS_OPTIONS: FilterOption[] = [
  { value: 'waiting', label: 'Ожидание' },
  { value: 'sent_from_uae', label: 'Отправлен из ОАЭ' },
  { value: 'transit_iran', label: 'Транзит Иран' },
  { value: 'in_transit', label: 'В пути' },
  { value: 'to_kazakhstan', label: 'В Казахстан' },
  { value: 'customs', label: 'Таможня' },
  { value: 'cleared_customs', label: 'Вышел с таможни' },
  { value: 'received', label: 'Получен' },
  { value: 'delivered', label: 'Доставлен' },
  { value: 'lost', label: 'Потерян' },
];

export const ORDER_STATUS_OPTIONS: FilterOption[] = [
  { value: 'created', label: 'Создан' },
  { value: 'paid', label: 'Оплачен' },
  { value: 'in_process', label: 'В обработке' },
  { value: 'shipped', label: 'Отправлен' },
  { value: 'delivered', label: 'Доставлен' },
  { value: 'cancelled', label: 'Отменен' },
];
