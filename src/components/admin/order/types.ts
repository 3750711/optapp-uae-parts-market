
// Переэкспорт унифицированных типов
export * from '@/types/order';

// Дополнительные типы для компонентов
export interface CreatedOrderProps {
  order: any;
  images: string[];
  onBack: () => void;
  onNewOrder: () => void;
  onOrderUpdate: (order: any) => void;
}
