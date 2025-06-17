
import React from "react";
import { Label } from "@/components/ui/label";
import OptimizedSelect from "@/components/ui/OptimizedSelect";
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
  // Prepare buyer options for OptimizedSelect
  const buyerOptions = React.useMemo(() => {
    return buyerProfiles
      .filter(buyer => buyer.opt_id && buyer.opt_id.trim()) // Более строгая проверка OPT_ID
      .sort((a, b) => a.opt_id.localeCompare(b.opt_id))
      .map(buyer => ({
        value: buyer.opt_id, // Используем opt_id как value
        label: `${buyer.full_name} (${buyer.opt_id})`,
        searchText: `${buyer.full_name} ${buyer.opt_id}`
      }));
  }, [buyerProfiles]);

  // Prepare seller options for OptimizedSelect
  const sellerOptions = React.useMemo(() => {
    return sellerProfiles
      .filter(seller => seller.id) // Убедимся что у продавца есть ID
      .sort((a, b) => {
        const aOptId = a.opt_id || '';
        const bOptId = b.opt_id || '';
        return aOptId.localeCompare(bOptId);
      })
      .map(seller => ({
        value: seller.id, // Используем ID как value для продавцов
        label: seller.opt_id ? `${seller.full_name} (${seller.opt_id})` : seller.full_name,
        searchText: `${seller.full_name} ${seller.opt_id || ''}`
      }));
  }, [sellerProfiles]);

  // Проверяем что выбранный покупатель существует в списке
  const selectedBuyerExists = React.useMemo(() => {
    if (!buyerOptId) return true; // Пустое значение допустимо
    return buyerOptions.some(option => option.value === buyerOptId);
  }, [buyerOptId, buyerOptions]);

  // Проверяем что выбранный продавец существует в списке
  const selectedSellerExists = React.useMemo(() => {
    if (!sellerId) return true; // Пустое значение допустимо
    return sellerOptions.some(option => option.value === sellerId);
  }, [sellerId, sellerOptions]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Участники заказа</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="buyerOptId">OPT_ID покупателя *</Label>
          <OptimizedSelect
            options={buyerOptions}
            value={buyerOptId}
            onValueChange={onBuyerOptIdChange}
            placeholder="Выберите покупателя..."
            searchPlaceholder="Поиск по имени или OPT_ID..."
            disabled={disabled}
          />
          {!selectedBuyerExists && buyerOptId && (
            <p className="text-sm text-red-600 mt-1">
              Покупатель с OPT_ID "{buyerOptId}" не найден в списке
            </p>
          )}
          {buyerOptions.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Нет доступных профилей покупателей
            </p>
          )}
        </div>

        {!hideSeller && (
          <div>
            <Label htmlFor="sellerId">Продавец *</Label>
            <OptimizedSelect
              options={sellerOptions}
              value={sellerId}
              onValueChange={onSellerIdChange}
              placeholder="Выберите продавца..."
              searchPlaceholder="Поиск продавца..."
              disabled={disabled}
            />
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
          </div>
        )}
      </div>
    </div>
  );
};
