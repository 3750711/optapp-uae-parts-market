
export interface CommunicationInfo {
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  recommendation?: string;
}

export interface CommunicationWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: () => void;
  communicationRating?: number | null;
  productTitle: string;
  productPrice: number;
  lotNumber?: number | null;
  contactType: 'telegram' | 'whatsapp';
  sellerContact?: {
    telegram?: string | null;
    phone?: string | null;
    seller_id?: string;
    working_hours?: {
      [key: string]: string;
    } | null;
  } | null;
  productId?: string;
  sellerId?: string;
}
