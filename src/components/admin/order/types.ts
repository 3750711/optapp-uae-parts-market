
// Переэкспорт унифицированных типов
export * from '@/types/order';

// Дополнительные типы для компонентов админ-панели
export interface OrderFormData {
  title: string;
  price: string;
  description: string;
  brand: string;
  model: string;
  brandId: string;
  modelId: string;
  sellerId: string;
  buyerOptId: string;
  deliveryMethod: 'cargo_rf' | 'cargo_kz' | 'self_pickup';
  delivery_price: string;
  place_number: string;
  text_order: string;
  [key: string]: string;
}

export interface CreatedOrderProps {
  order: any;
  images: string[];
  videos?: string[];
  onBack?: () => void;
  onNewOrder: () => void;
  onOrderUpdate: (order: any) => void;
  buyerProfile?: any;
}

export interface FormValidationState {
  isValid: boolean;
  errors: Record<string, string>;
  touchedFields: Set<string>;
}

export interface AutoSaveData {
  formData: OrderFormData;
  images: string[];
  videos: string[];
  timestamp: number;
}
