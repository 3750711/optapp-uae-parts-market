
export interface OrderInfo {
  orderNumber: number;
  title: string;
  brand?: string;
  model?: string;
  price: number;
  deliveryMethod: string;
}

export interface SellerInfo {
  name: string;
  optId?: string;
  telegram?: string;
}

export interface EnhancedSuccessOrderDialogProps {
  open: boolean;
  onClose: () => void;
  orderInfo: OrderInfo;
  sellerInfo: SellerInfo;
}
