
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface OrdersImportButtonProps {
  onImportComplete?: () => void;
}

export const OrdersImportButton: React.FC<OrdersImportButtonProps> = ({
  onImportComplete
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Импортируемые данные:', jsonData);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData as any[]) {
        try {
          // Маппинг полей из Excel в поля базы данных
          const orderData = {
            title: row['Название'] || row['Title'] || 'Импорт из Excel',
            price: parseFloat(row['Цена'] || row['Price'] || '0'),
            brand: row['Бренд'] || row['Brand'] || '',
            model: row['Модель'] || row['Model'] || '',
            place_number: parseInt(row['Количество мест'] || row['Places'] || '1'),
            text_order: row['Дополнительная информация'] || row['Description'] || '',
            delivery_price_confirm: parseFloat(row['Цена доставки'] || row['Delivery Price'] || '0'),
            order_number: parseInt(row['Номер заказа'] || row['Order Number'] || '0'),
            status: 'created' as const,
            order_created_type: 'free_order' as const,
            delivery_method: 'self_pickup' as const,
          };

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
      }

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

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleFileSelect}
        className="hover:bg-blue-50 hover:border-blue-300"
        title="Ожидаемые столбцы: Название/Title, Цена/Price, Бренд/Brand, Модель/Model, Количество мест/Places, Дополнительная информация/Description, Цена доставки/Delivery Price, Номер заказа/Order Number, ID продавца/Seller ID, ID покупателя/Buyer ID"
      >
        <FileUp className="h-4 w-4 mr-1 text-blue-600" />
        Импорт из Excel
      </Button>
    </>
  );
};
