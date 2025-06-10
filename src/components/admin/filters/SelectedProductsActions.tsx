
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Edit, X } from 'lucide-react';

interface SelectedProductsActionsProps {
  selectedCount: number;
  onStatusChange: (status: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClearSelection: () => void;
}

const SelectedProductsActions: React.FC<SelectedProductsActionsProps> = ({
  selectedCount,
  onStatusChange,
  onDelete,
  onClearSelection
}) => {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              Выбрано товаров: {selectedCount}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange('published')}
              >
                <Edit className="h-4 w-4 mr-1" />
                Опубликовать
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange('blocked')}
              >
                <Edit className="h-4 w-4 mr-1" />
                Заблокировать
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Удалить
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
            Снять выделение
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectedProductsActions;
