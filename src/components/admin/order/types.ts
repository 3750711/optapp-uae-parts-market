
import { Database } from "@/integrations/supabase/types";

export type OrderCreatedType = Database["public"]["Enums"]["order_created_type"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

export type ProfileShort = {
  id: string;
  opt_id: string;
  full_name?: string | null;
};

export type SellerProfile = {
  id: string;
  full_name?: string | null;
  opt_id?: string | null;
  telegram?: string | null;
};

export interface OrderFormData {
  title: string;
  price: string;
  buyerOptId: string;
  brand: string;
  model: string;
  sellerId: string;
  deliveryMethod: DeliveryMethod;
  place_number: string;
  text_order: string;
  delivery_price: string;
}

export interface CreatedOrderProps {
  order: any;
  images: string[];
  onBack: () => void;
  onNewOrder: () => void;
  onOrderUpdate: (updatedOrder: any) => void;
}
