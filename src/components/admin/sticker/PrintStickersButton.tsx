import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PrintStickersButtonProps {
  selectedOrderIds: string[];
  onSuccess?: () => void;
  disabled?: boolean;
}

/**
 * Кнопка для batch-генерации стикеров через CraftMyPDF
 * 
 * @param selectedOrderIds - Массив ID выбранных заказов
 * @param onSuccess - Callback после успешной генерации (для очистки выбора)
 * @param disabled - Внешний disabled state
 */
export function PrintStickersButton({ 
  selectedOrderIds, 
  onSuccess,
  disabled = false
}: PrintStickersButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error('Выберите заказы для печати');
      return;
    }

    setIsGenerating(true);
    console.log('🏷️ [PrintStickers] Starting generation for', selectedOrderIds.length, 'orders');

    try {
      const { data, error } = await supabase.functions.invoke('generate-stickers-batch', {
        body: { 
          orderIds: selectedOrderIds 
        },
      });

      if (error) {
        console.error('❌ [PrintStickers] Error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to generate stickers');
      }

      console.log('✅ [PrintStickers] Success:', data);

      // Open PDF in new tab
      window.open(data.pdf_url, '_blank');

      // Show success toast with details
      toast.success(
        <div className="space-y-1">
          <div className="font-medium">✅ Стикеры готовы!</div>
          <div className="text-sm opacity-90">
            Создано: {data.total_stickers} шт.
          </div>
          <div className="text-xs opacity-75">
            Номера: {data.sticker_numbers.slice(0, 5).join(', ')}
            {data.sticker_numbers.length > 5 && '...'}
          </div>
        </div>,
        { duration: 5000 }
      );

      // Call success callback (to clear selection)
      onSuccess?.();

    } catch (err: any) {
      console.error('❌ [PrintStickers] Failed:', err);
      toast.error(err.message || 'Ошибка при создании стикеров');
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = disabled || isGenerating || selectedOrderIds.length === 0;

  return (
    <Button
      onClick={handlePrint}
      disabled={isDisabled}
      variant={selectedOrderIds.length > 0 ? 'default' : 'outline'}
      className="gap-2 bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 disabled:opacity-50"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Генерация...
        </>
      ) : (
        <>
          <Printer className="h-4 w-4" />
          Печать стикеров
          {selectedOrderIds.length > 0 && (
            <span className="ml-1 font-semibold">({selectedOrderIds.length})</span>
          )}
        </>
      )}
    </Button>
  );
}
