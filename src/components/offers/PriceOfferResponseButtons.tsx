
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useUpdatePriceOffer } from '@/hooks/use-price-offers';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { PriceOffer } from '@/types/price-offer';

interface PriceOfferResponseButtonsProps {
  offer: PriceOffer;
  onResponse?: (offerId: string, status: string) => void;
}

export const PriceOfferResponseButtons: React.FC<PriceOfferResponseButtonsProps> = ({ 
  offer, 
  onResponse 
}) => {
  const [sellerResponse, setSellerResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const updateOffer = useUpdatePriceOffer();

  const handleResponse = async (status: 'accepted' | 'rejected') => {
    if (updateOffer.isPending) return;

    setIsResponding(true);
    
    try {
      // Optimistic update - immediately disable buttons
      onResponse?.(offer.id, status);
      
      await updateOffer.mutateAsync({
        offerId: offer.id,
        data: {
          status,
          seller_response: sellerResponse || undefined,
        },
      });
      
      console.log('✅ Offer response sent successfully');
      setSellerResponse('');
    } catch (error) {
      console.error('❌ Failed to respond to offer:', error);
      // Revert optimistic update on error
      onResponse?.(offer.id, 'pending');
    } finally {
      setIsResponding(false);
    }
  };

  // Don't show buttons if offer is not pending
  if (offer.status !== 'pending') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="capitalize">{offer.status}</span>
        {offer.seller_response && (
          <span>• {offer.seller_response}</span>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4" />
          Ответ на предложение
        </div>
        
        <Textarea
          placeholder="Дополнительное сообщение для покупателя (опционально)"
          value={sellerResponse}
          onChange={(e) => setSellerResponse(e.target.value)}
          className="min-h-[80px]"
          disabled={updateOffer.isPending || isResponding}
        />
        
        <div className="flex gap-2">
          <Button
            onClick={() => handleResponse('accepted')}
            disabled={updateOffer.isPending || isResponding}
            className="flex-1"
            variant="default"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {updateOffer.isPending && updateOffer.variables?.data.status === 'accepted' ? 'Принимаю...' : 'Принять'}
          </Button>
          
          <Button
            onClick={() => handleResponse('rejected')}
            disabled={updateOffer.isPending || isResponding}
            className="flex-1"
            variant="destructive"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {updateOffer.isPending && updateOffer.variables?.data.status === 'rejected' ? 'Отклоняю...' : 'Отклонить'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
