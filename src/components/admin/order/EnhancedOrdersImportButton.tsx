import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUp, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { ImportPreviewDialog, ImportPreviewData, ImportOptions, ImportRow } from './ImportPreviewDialog';
import { validateImportRow, buildUsersCache, createMissingUser, validateExcelFile } from './ImportValidationUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { normalizeDecimal } from '@/utils/number';

interface EnhancedOrdersImportButtonProps {
  onImportComplete?: () => void;
}

interface ImportProgress {
  isImporting: boolean;
  currentRow: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  stage: 'validating' | 'importing' | 'completed';
}

export const EnhancedOrdersImportButton: React.FC<EnhancedOrdersImportButtonProps> = ({
  onImportComplete
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    isImporting: false,
    currentRow: 0,
    totalRows: 0,
    successCount: 0,
    errorCount: 0,
    stage: 'validating'
  });
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [rawExcelData, setRawExcelData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [fileValidationError, setFileValidationError] = useState<string>('');


  const resetProgress = () => {
    setProgress({
      isImporting: false,
      currentRow: 0,
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
      stage: 'validating'
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileValidationError('');

    console.log('Выбран файл:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    });

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      const error = "Пожалуйста, выберите файл Excel (.xlsx или .xls)";
      setFileValidationError(error);
      toast({
        title: "Ошибка формата файла",
        description: error,
        variant: "destructive",
      });
      return;
    }

    if (file.size === 0) {
      const error = "Файл пустой";
      setFileValidationError(error);
      toast({
        title: "Ошибка",
        description: error,
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      const error = "Файл слишком большой (максимум 10MB)";
      setFileValidationError(error);
      toast({
        title: "Ошибка",
        description: error,
        variant: "destructive",
      });
      return;
    }

    try {
      setProgress({ 
        isImporting: true, 
        currentRow: 0, 
        totalRows: 0, 
        successCount: 0, 
        errorCount: 0,
        stage: 'validating'
      });

      console.log('Начинаем чтение файла...');
      const data = await file.arrayBuffer();
      console.log('Файл прочитан, размер буфера:', data.byteLength);
      
      const workbook = XLSX.read(data);
      console.log('Workbook создан, листы:', workbook.SheetNames);
      
      if (workbook.SheetNames.length === 0) {
        throw new Error('Файл не содержит листов');
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      console.log('Выбран лист:', sheetName);
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log('Данные извлечены из Excel:', {
        rowCount: jsonData.length,
        firstRow: jsonData[0]
      });

      if (jsonData.length === 0) {
        throw new Error('Первый лист файла пустой');
      }

      // Валидируем структуру файла
      const fileValidation = validateExcelFile(jsonData);
      console.log('Результат валидации файла:', fileValidation);

      if (!fileValidation.isValid) {
        const errorMessage = fileValidation.errors.join('; ');
        setFileValidationError(errorMessage);
        resetProgress();
        toast({
          title: "Ошибка структуры файла",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      setRawExcelData(jsonData);
      setColumnMapping(fileValidation.columnMapping);

      // Build users cache and validate data - ИСПРАВЛЕНО: передаем columnMapping
      const { cache, missingUsers } = await buildUsersCache(jsonData, fileValidation.columnMapping);
      console.log('Кэш пользователей построен:', {
        cacheSize: cache.size,
        missingUsers
      });

      const rows: ImportRow[] = [];
      let validCount = 0;
      let invalidCount = 0;
      let warningsCount = 0;

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const validation = await validateImportRow(row, i + 2, cache, fileValidation.columnMapping);
        
        const importRow: ImportRow = {
          rowNumber: i + 2,
          data: row,
          errors: validation.errors,
          warnings: validation.warnings,
          isValid: validation.isValid,
          sellerId: validation.sellerId,
          buyerId: validation.buyerId
        };

        rows.push(importRow);

        if (validation.isValid) {
          validCount++;
        } else {
          invalidCount++;
        }

        if (validation.warnings.length > 0) {
          warningsCount++;
        }

        setProgress(prev => ({
          ...prev,
          currentRow: i + 1,
          totalRows: jsonData.length
        }));

        // Small delay for UI updates
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      const previewData: ImportPreviewData = {
        rows,
        missingUsers,
        stats: {
          total: jsonData.length,
          valid: validCount,
          invalid: invalidCount,
          warnings: warningsCount
        }
      };

      setPreviewData(previewData);
      setShowPreview(true);
      resetProgress();

      toast({
        title: "Файл обработан",
        description: `Найдено ${validCount} валидных строк из ${jsonData.length}`,
      });

    } catch (error) {
      console.error('Ошибка при чтении файла:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setFileValidationError(`Ошибка чтения файла: ${errorMessage}`);
      resetProgress();
      toast({
        title: "Ошибка чтения файла",
        description: errorMessage,
        variant: "destructive",
      });
    }

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async (options: ImportOptions) => {
    if (!previewData || !rawExcelData) return;

    try {
      setProgress({
        isImporting: true,
        currentRow: 0,
        totalRows: options.selectedRows.length,
        successCount: 0,
        errorCount: 0,
        stage: 'importing'
      });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Create missing users if option is enabled
      if (options.createMissingUsers) {
        console.log('Создание отсутствующих пользователей...');
        
        for (const sellerId of previewData.missingUsers.sellers) {
          const userId = await createMissingUser(sellerId, 'seller');
          if (userId) {
            console.log(`Создан продавец ${sellerId} с ID ${userId}`);
          }
        }

        for (const buyerId of previewData.missingUsers.buyers) {
          const userId = await createMissingUser(buyerId, 'buyer');
          if (userId) {
            console.log(`Создан покупатель ${buyerId} с ID ${userId}`);
          }
        }

        // Rebuild cache after creating users
        const { cache } = await buildUsersCache(rawExcelData, columnMapping);
        
        // Update preview data with new user info
        for (const row of previewData.rows) {
          const sellerOptId = row.data[columnMapping.sellerId] || '';
          const buyerOptId = row.data[columnMapping.buyerId] || '';
          
          if (sellerOptId && cache.has(`seller_${sellerOptId}`)) {
            row.sellerId = cache.get(`seller_${sellerOptId}`);
          }
          if (buyerOptId && cache.has(`buyer_${buyerOptId}`)) {
            row.buyerId = cache.get(`buyer_${buyerOptId}`);
          }
        }
      }

      // Import selected rows
      for (let i = 0; i < options.selectedRows.length; i++) {
        const rowNumber = options.selectedRows[i];
        const importRow = previewData.rows.find(r => r.rowNumber === rowNumber);
        
        if (!importRow) continue;

        setProgress(prev => ({
          ...prev,
          currentRow: i + 1
        }));

        try {
          const row = importRow.data;
          const excelOrderNumber = normalizeDecimal(row[columnMapping.orderNumber] || '0');
          
          const orderData: any = {
            title: row[columnMapping.title] || 'Импорт из Excel',
            price: normalizeDecimal(row[columnMapping.price] || '0'),
            brand: row[columnMapping.brand] || '',
            model: row[columnMapping.model] || '',
            place_number: normalizeDecimal(row[columnMapping.places] || '1'),
            text_order: row[columnMapping.description] || '',
            delivery_price_confirm: normalizeDecimal(row[columnMapping.deliveryPrice] || '0'),
            status: 'created' as const,
            order_created_type: 'free_order' as const,
            delivery_method: 'cargo_rf' as const,
            seller_id: importRow.sellerId || options.defaultSellerId,
            buyer_id: importRow.buyerId || options.defaultBuyerId,
          };

          if (excelOrderNumber > 0) {
            orderData.order_number = excelOrderNumber;
          }

          if (!orderData.seller_id || !orderData.buyer_id) {
            throw new Error('Отсутствует ID продавца или покупателя');
          }

          const { error } = await supabase
            .from('orders')
            .insert(orderData);

          if (error) {
            console.error('Ошибка при создании заказа:', error);
            errors.push(`Строка ${rowNumber}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Ошибка при обработке строки:', error);
          errors.push(`Строка ${rowNumber}: ${error}`);
          errorCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setProgress(prev => ({
        ...prev,
        successCount,
        errorCount,
        stage: 'completed'
      }));

      setShowPreview(false);
      resetProgress();

      if (errors.length > 0) {
        console.log('Ошибки импорта:', errors);
      }

      toast({
        title: "Импорт завершен",
        description: `Успешно: ${successCount}, ошибок: ${errorCount}`,
        variant: successCount > 0 ? "default" : "destructive",
      });

      if (onImportComplete && successCount > 0) {
        onImportComplete();
      }

    } catch (error) {
      console.error('Ошибка импорта:', error);
      resetProgress();
      toast({
        title: "Ошибка импорта",
        description: "Произошла ошибка при импорте заказов",
        variant: "destructive",
      });
    }
  };

  const progressPercentage = progress.totalRows > 0 
    ? Math.round((progress.currentRow / progress.totalRows) * 100) 
    : 0;

  return (
    <>
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          disabled={progress.isImporting}
          className="hover:bg-blue-50 hover:border-blue-300 relative"
          title="Загрузить файл Excel для предварительного просмотра"
        >
          {progress.isImporting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin text-blue-600" />
          ) : (
            <FileUp className="h-4 w-4 mr-1 text-blue-600" />
          )}
          {progress.isImporting ? 'Обработка...' : 'Импорт из Excel'}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={progress.isImporting}
          />
        </Button>

        {fileValidationError && (
          <Alert variant="destructive" className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {fileValidationError}
              <div className="mt-2 text-xs">
                <div className="font-medium mb-1">Ожидаемые столбцы:</div>
                <div>• Title или Название (обязательно)</div>
                <div>• Price или Цена (обязательно)</div>
                <div>• Seller ID или ID продавца (обязательно)</div>
                <div>• Buyer ID или ID покупателя (обязательно)</div>
                <div>• Order Number или Номер заказа (опционально)</div>
                <div>• Places или Количество мест (опционально)</div>
                <div>• Цена доставки или Delivery Price (опционально)</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {progress.isImporting && (
          <div className="w-full space-y-2 p-3 bg-blue-50 rounded-lg border">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {progress.stage === 'validating' ? 'Валидация данных...' : 'Импорт заказов...'}
              </span>
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

      <ImportPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        previewData={previewData}
        onImport={handleImport}
        isImporting={progress.isImporting}
      />
    </>
  );
};
