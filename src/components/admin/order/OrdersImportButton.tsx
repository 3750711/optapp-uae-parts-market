
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUp, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { normalizeDecimal } from '@/utils/number';

interface OrdersImportButtonProps {
  onImportComplete?: () => void;
}

interface ImportProgress {
  isImporting: boolean;
  currentRow: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
}

export const OrdersImportButton: React.FC<OrdersImportButtonProps> = ({
  onImportComplete
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    isImporting: false,
    currentRow: 0,
    totalRows: 0,
    successCount: 0,
    errorCount: 0
  });


  const updateProgress = (current: number, total: number, success: number, errors: number) => {
    setProgress({
      isImporting: true,
      currentRow: current,
      totalRows: total,
      successCount: success,
      errorCount: errors
    });
  };

  const resetProgress = () => {
    setProgress({
      isImporting: false,
      currentRow: 0,
      totalRows: 0,
      successCount: 0,
      errorCount: 0
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите файл Excel (.xlsx или .xls)",
        variant: "destructive",
      });
      return;
    }

    try {
      setProgress({ isImporting: true, currentRow: 0, totalRows: 0, successCount: 0, errorCount: 0 });

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Импортируемые данные:', jsonData);

      const totalRows = jsonData.length;
      setProgress({ isImporting: true, currentRow: 0, totalRows, successCount: 0, errorCount: 0 });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
        // Обновляем прогресс
        updateProgress(i + 1, totalRows, successCount, errorCount);

        try {
          // Получаем номер заказа из Excel
          const excelOrderNumber = parseInt(row['Номер заказа'] || row['Order Number'] || '0');
          
          // Базовые данные заказа
          const orderData: any = {
            title: row['Название'] || row['Title'] || 'Импорт из Excel',
            price: normalizeDecimal(row['Цена'] || row['Price'] || '0'),
            brand: row['Бренд'] || row['Brand'] || '',
            model: row['Модель'] || row['Model'] || '',
            place_number: parseInt(row['Количество мест'] || row['Places'] || '1'),
            text_order: row['Дополнительная информация'] || row['Description'] || '',
            delivery_price_confirm: normalizeDecimal(row['Цена доставки'] || row['Delivery Price'] || '0'),
            status: 'created' as const,
            order_created_type: 'free_order' as const,
            delivery_method: 'cargo_rf' as const,
          };

          // Добавляем order_number только если это реальное значение (не 0)
          if (excelOrderNumber > 0) {
            orderData.order_number = excelOrderNumber;
          }

          // Поиск продавца по opt_id или email
          let sellerId = null;
          let buyerId = null;

          if (row['ID продавца'] || row['Seller ID']) {
            const { data: seller } = await supabase
              .from('profiles')
              .select('id')
              .eq('opt_id', row['ID продавца'] || row['Seller ID'])
              .single();
            sellerId = seller?.id;
          }

          if (row['ID покупателя'] || row['Buyer ID']) {
            const { data: buyer } = await supabase
              .from('profiles')
              .select('id')
              .eq('opt_id', row['ID покупателя'] || row['Buyer ID'])
              .single();
            buyerId = buyer?.id;
          }

          // Если не найдены продавец или покупатель, пропускаем
          if (!sellerId || !buyerId) {
            console.warn('Пропущена строка - не найден продавец или покупатель:', row);
            errorCount++;
            continue;
          }

          const { error } = await supabase
            .from('orders')
            .insert({
              ...orderData,
              seller_id: sellerId,
              buyer_id: buyerId,
            });

          if (error) {
            console.error('Ошибка при создании заказа:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Ошибка при обработке строки:', error);
          errorCount++;
        }

        // Небольшая задержка для обновления UI
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      resetProgress();

      toast({
        title: "Импорт завершен",
        description: `Успешно импортировано: ${successCount}, ошибок: ${errorCount}`,
        variant: successCount > 0 ? "default" : "destructive",
      });

      if (onImportComplete && successCount > 0) {
        onImportComplete();
      }

    } catch (error) {
      console.error('Ошибка при чтении файла:', error);
      resetProgress();
      toast({
        title: "Ошибка",
        description: "Не удалось прочитать файл Excel",
        variant: "destructive",
      });
    }

    // Очищаем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const progressPercentage = progress.totalRows > 0 
    ? Math.round((progress.currentRow / progress.totalRows) * 100) 
    : 0;

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        disabled={progress.isImporting}
        className="hover:bg-blue-50 hover:border-blue-300 relative"
        title="Ожидаемые столбцы: Название/Title, Цена/Price, Бренд/Brand, Модель/Model, Количество мест/Places, Дополнительная информация/Description, Цена доставки/Delivery Price, Номер заказа/Order Number, ID продавца/Seller ID, ID покупателя/Buyer ID"
      >
        {progress.isImporting ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin text-blue-600" />
        ) : (
          <FileUp className="h-4 w-4 mr-1 text-blue-600" />
        )}
        {progress.isImporting ? 'Импортируется...' : 'Импорт из Excel'}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={progress.isImporting}
        />
      </Button>

      {progress.isImporting && (
        <div className="w-full space-y-2 p-3 bg-blue-50 rounded-lg border">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Импорт заказов...</span>
            <span>{progress.currentRow} из {progress.totalRows}</span>
          </div>
          
          <Progress value={progressPercentage} className="w-full" />
          
          <div className="flex justify-between text-xs text-gray-500">
            <span className="text-green-600">✓ Успешно: {progress.successCount}</span>
            <span className="text-red-600">✗ Ошибок: {progress.errorCount}</span>
            <span>{progressPercentage}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
