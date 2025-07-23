
export interface PusherOfferEvent {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  offered_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
  action: 'created' | 'updated' | 'deleted';
}

export interface PusherProductEvent {
  product_id: string;
  has_active_offers: boolean;
  offers_count: number;
  max_offer_price: number;
  action: 'offer_created' | 'offer_updated' | 'offer_deleted';
}

export interface PusherConnectionState {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed';
  lastError?: string;
  reconnectAttempts: number;
}

export interface PusherConfig {
  key: string;
  cluster: string;
  forceTLS: boolean;
  authEndpoint?: string;
}
