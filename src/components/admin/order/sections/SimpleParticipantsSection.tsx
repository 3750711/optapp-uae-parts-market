
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BuyerProfile, SellerProfile } from "@/types/order";

interface SimpleParticipantsSectionProps {
  buyerOptId: string;
  sellerId: string;
  onBuyerOptIdChange: (value: string) => void;
  onSellerIdChange: (value: string) => void;
  buyerProfiles: BuyerProfile[];
  sellerProfiles: SellerProfile[];
  disabled?: boolean;
  hideSeller?: boolean;
}

// Функция нормализации OPT_ID для консистентности
const normalizeOptId = (optId: string): string => {
  return optId.trim().toUpperCase().replace(/\s+/g, '');
};

export const SimpleParticipantsSection: React.FC<SimpleParticipantsSectionProps> = ({
  buyerOptId,
  sellerId,
  onBuyerOptIdChange,
  onSellerIdChange,
  buyerProfiles,
  sellerProfiles,
  disabled = false,
  hideSeller = false,
}) => {
  // Prepare buyer options sorted by OPT_ID
  const buyerOptions = React.useMemo(() => {
    return buyerProfiles
      .filter(buyer => buyer.opt_id && buyer.opt_id.trim())
      .sort((a, b) => {
        const aOptId = normalizeOptId(a.opt_id || '');
        const bOptId = normalizeOptId(b.opt_id || '');
        return aOptId.localeCompare(bOptId);
      });
  }, [buyerProfiles]);

  // Prepare seller options sorted by OPT_ID
  const sellerOptions = React.useMemo(() => {
    return sellerProfiles
      .filter(seller => seller.id)
      .sort((a, b) => {
        const aOptId = a.opt_id || '';
        const bOptId = b.opt_id || '';
        return aOptId.localeCompare(bOptId);
      });
  }, [sellerProfiles]);

  // Проверяем что выбранный покупатель существует в списке
  const selectedBuyerExists = React.useMemo(() => {
    if (!buyerOptId) return true;
    
    const normalizedSelected = normalizeOptId(buyerOptId);
    return buyerOptions.some(buyer => {
      const normalizedOption = normalizeOptId(buyer.opt_id || '');
      return buyer.opt_id === buyerOptId || normalizedOption === normalizedSelected;
    });
  }, [buyerOptId, buyerOptions]);

  // Проверяем что выбранный продавец существует в списке
  const selectedSellerExists = React.useMemo(() => {
    if (!sellerId) return true;
    return sellerOptions.some(seller => seller.id === sellerId);
  }, [sellerId, sellerOptions]);

  // Найдем выбранного покупателя для отображения дополнительной информации
  const selectedBuyer = React.useMemo(() => {
    if (!buyerOptId) return null;
    const normalizedSelected = normalizeOptId(buyerOptId);
    return buyerProfiles.find(buyer => {
      const normalizedBuyer = normalizeOptId(buyer.opt_id || '');
      return buyer.opt_id === buyerOptId || normalizedBuyer === normalizedSelected;
    });
  }, [buyerOptId, buyerProfiles]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Участники заказа</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="buyerOptId">OPT_ID покупателя *</Label>
          <Select
            value={buyerOptId}
            onValueChange={onBuyerOptIdChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите покупателя..." />
            </SelectTrigger>
            <SelectContent>
              {buyerOptions.map((buyer) => (
                <SelectItem key={buyer.id} value={buyer.opt_id}>
                  {buyer.full_name || 'Без имени'} ({buyer.opt_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectedBuyerExists && buyerOptId && (
            <p className="text-sm text-red-600 mt-1">
              Покупатель с OPT_ID "{buyerOptId}" не найден в списке. Проверьте правильность написания.
            </p>
          )}
          {selectedBuyer && (
            <div className="text-sm text-gray-600 mt-1">
              <p>✅ Найден: {selectedBuyer.full_name}</p>
              {selectedBuyer.telegram && (
                <p>📱 Telegram: {selectedBuyer.telegram}</p>
              )}
            </div>
          )}
          {buyerOptions.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Нет доступных профилей покупателей с OPT_ID
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Доступно покупателей: {buyerOptions.length}
          </p>
        </div>

        {!hideSeller && (
          <div>
            <Label htmlFor="sellerId">Продавец *</Label>
            <Select
              value={sellerId}
              onValueChange={onSellerIdChange}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите продавца..." />
              </SelectTrigger>
              <SelectContent>
                {sellerOptions.map((seller) => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.opt_id ? `${seller.full_name || 'Без имени'} (${seller.opt_id})` : (seller.full_name || 'Без имени')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedSellerExists && sellerId && (
              <p className="text-sm text-red-600 mt-1">
                Выбранный продавец не найден в списке
              </p>
            )}
            {sellerOptions.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Нет доступных профилей продавцов
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Доступно продавцов: {sellerOptions.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
