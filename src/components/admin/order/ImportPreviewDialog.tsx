
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, XCircle, Download, Users, FileSpreadsheet } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ImportRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
  isValid: boolean;
  sellerId?: string;
  buyerId?: string;
}

export interface ImportPreviewData {
  rows: ImportRow[];
  missingUsers: {
    sellers: string[];
    buyers: string[];
  };
  stats: {
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
  };
}

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: ImportPreviewData | null;
  onImport: (options: ImportOptions) => void;
  isImporting: boolean;
}

export interface ImportOptions {
  skipInvalidRows: boolean;
  createMissingUsers: boolean;
  defaultSellerId?: string;
  defaultBuyerId?: string;
  selectedRows: number[];
}

export const ImportPreviewDialog: React.FC<ImportPreviewDialogProps> = ({
  open,
  onOpenChange,
  previewData,
  onImport,
  isImporting
}) => {
  const [options, setOptions] = useState<ImportOptions>({
    skipInvalidRows: true,
    createMissingUsers: false,
    selectedRows: []
  });

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  React.useEffect(() => {
    if (previewData) {
      const validRows = previewData.rows
        .filter(row => row.isValid)
        .map(row => row.rowNumber);
      setSelectedRows(new Set(validRows));
      setOptions(prev => ({
        ...prev,
        selectedRows: validRows
      }));
    }
  }, [previewData]);

  const handleRowSelection = (rowNumber: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowNumber);
    } else {
      newSelected.delete(rowNumber);
    }
    setSelectedRows(newSelected);
    setOptions(prev => ({
      ...prev,
      selectedRows: Array.from(newSelected)
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allValidRows = previewData?.rows
        .filter(row => row.isValid)
        .map(row => row.rowNumber) || [];
      setSelectedRows(new Set(allValidRows));
      setOptions(prev => ({
        ...prev,
        selectedRows: allValidRows
      }));
    } else {
      setSelectedRows(new Set());
      setOptions(prev => ({
        ...prev,
        selectedRows: []
      }));
    }
  };

  const exportErrorReport = () => {
    if (!previewData) return;

    const errorReport = previewData.rows
      .filter(row => row.errors.length > 0 || row.warnings.length > 0)
      .map(row => ({
        'Строка': row.rowNumber,
        'Статус': row.isValid ? 'Предупреждения' : 'Ошибки',
        'Проблемы': [...row.errors, ...row.warnings].join('; '),
        'Данные': JSON.stringify(row.data)
      }));

    const csvContent = [
      Object.keys(errorReport[0] || {}).join(','),
      ...errorReport.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImport = () => {
    onImport(options);
  };

  if (!previewData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Превью импорта заказов
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Валидные строки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {previewData.stats.valid}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Ошибки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {previewData.stats.invalid}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Предупреждения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {previewData.stats.warnings}
              </div>
            </CardContent>
          </Card>
        </div>

        {(previewData.missingUsers.sellers.length > 0 || previewData.missingUsers.buyers.length > 0) && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Отсутствующие пользователи
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {previewData.missingUsers.sellers.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Продавцы:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewData.missingUsers.sellers.map(id => (
                      <Badge key={id} variant="outline" className="text-xs">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {previewData.missingUsers.buyers.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Покупатели:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewData.missingUsers.buyers.map(id => (
                      <Badge key={id} variant="outline" className="text-xs">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4 mb-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipInvalid"
                checked={options.skipInvalidRows}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, skipInvalidRows: !!checked }))
                }
              />
              <label htmlFor="skipInvalid" className="text-sm">
                Пропускать строки с ошибками
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="createUsers"
                checked={options.createMissingUsers}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, createMissingUsers: !!checked }))
                }
              />
              <label htmlFor="createUsers" className="text-sm">
                Создавать отсутствующих пользователей
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedRows.size === previewData.rows.filter(r => r.isValid).length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm">
              Выбрано: {selectedRows.size} из {previewData.stats.valid} валидных строк
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportErrorReport}
              disabled={previewData.stats.invalid === 0 && previewData.stats.warnings === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Экспорт ошибок
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 border rounded-md">
          <div className="space-y-2 p-4">
            {previewData.rows.map((row) => (
              <div
                key={row.rowNumber}
                className={`p-3 border rounded-md ${
                  row.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {row.isValid && (
                      <Checkbox
                        checked={selectedRows.has(row.rowNumber)}
                        onCheckedChange={(checked) => 
                          handleRowSelection(row.rowNumber, !!checked)
                        }
                      />
                    )}
                    <span className="font-medium text-sm">
                      Строка {row.rowNumber}
                    </span>
                    {row.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="mt-2 text-xs space-y-1">
                  <div>
                    <strong>Заказ:</strong> {row.data['Название'] || row.data['Title'] || 'Не указано'} |
                    <strong> Цена:</strong> {row.data['Цена'] || row.data['Price'] || 'Не указано'} |
                    <strong> Продавец:</strong> {row.data['ID продавца'] || row.data['Seller ID'] || 'Не указано'} |
                    <strong> Покупатель:</strong> {row.data['ID покупателя'] || row.data['Buyer ID'] || 'Не указано'}
                  </div>
                </div>

                {row.errors.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-red-600">Ошибки:</span>
                    <ul className="text-xs text-red-600 ml-4 list-disc">
                      {row.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {row.warnings.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-yellow-600">Предупреждения:</span>
                    <ul className="text-xs text-yellow-600 ml-4 list-disc">
                      {row.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleImport}
            disabled={selectedRows.size === 0 || isImporting}
          >
            {isImporting ? 'Импортируется...' : `Импортировать ${selectedRows.size} заказов`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
