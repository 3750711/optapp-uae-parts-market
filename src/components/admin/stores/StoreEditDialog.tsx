
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield } from 'lucide-react';
import { StoreTag } from '@/types/store';
import StoreCarBrandsSection from './StoreCarBrandsSection';

type StoreWithDetails = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  location: string | null;
  phone: string | null;
  owner_name: string | null;
  tags: StoreTag[] | null;
  verified: boolean;
  telegram: string | null;
};

interface StoreEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreWithDetails | null;
  editedStore: Partial<StoreWithDetails>;
  selectedCarBrands: string[];
  selectedCarModels: {[brandId: string]: string[]};
  selectedBrandForModels: string | null;
  onClose: () => void;
  onSave: () => void;
  onChange: (key: keyof StoreWithDetails, value: any) => void;
  onToggleTag: (tag: StoreTag) => void;
  onToggleCarBrand: (brandId: string) => void;
  onToggleCarModel: (modelId: string, brandId: string) => void;
  onSelectBrandForModels: (brandId: string) => void;
}

const StoreEditDialog: React.FC<StoreEditDialogProps> = ({
  isOpen,
  onOpenChange,
  store,
  editedStore,
  selectedCarBrands,
  selectedCarModels,
  selectedBrandForModels,
  onClose,
  onSave,
  onChange,
  onToggleTag,
  onToggleCarBrand,
  onToggleCarModel,
  onSelectBrandForModels
}) => {
  const availableTags: { value: StoreTag; label: string }[] = [
    { value: 'electronics', label: 'Электроника' },
    { value: 'auto_parts', label: 'Автозапчасти' },
    { value: 'accessories', label: 'Аксессуары' },
    { value: 'spare_parts', label: 'Запчасти' },
    { value: 'other', label: 'Другое' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать магазин</DialogTitle>
          <DialogDescription>
            Внесите изменения в информацию о магазине.
          </DialogDescription>
        </DialogHeader>

        {store && (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Название магазина</label>
                <Input
                  value={editedStore.name || ''}
                  onChange={(e) => onChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  value={editedStore.description || ''}
                  onChange={(e) => onChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Адрес</label>
                  <Input
                    value={editedStore.address || ''}
                    onChange={(e) => onChange('address', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Город</label>
                  <Input
                    value={editedStore.location || ''}
                    onChange={(e) => onChange('location', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Телефон</label>
                  <Input
                    value={editedStore.phone || ''}
                    onChange={(e) => onChange('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Имя владельца</label>
                  <Input
                    value={editedStore.owner_name || ''}
                    onChange={(e) => onChange('owner_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Телеграм</label>
                <Input
                  value={editedStore.telegram || ''}
                  onChange={(e) => onChange('telegram', e.target.value)}
                  placeholder="username или https://t.me/username"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Теги</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <div key={tag.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.value}`}
                        checked={(editedStore.tags || []).includes(tag.value)}
                        onCheckedChange={() => onToggleTag(tag.value)}
                      />
                      <label
                        htmlFor={`tag-${tag.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {tag.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <StoreCarBrandsSection
                selectedCarBrands={selectedCarBrands}
                selectedCarModels={selectedCarModels}
                selectedBrandForModels={selectedBrandForModels}
                onToggleCarBrand={onToggleCarBrand}
                onToggleCarModel={onToggleCarModel}
                onSelectBrandForModels={onSelectBrandForModels}
              />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={editedStore.verified}
                  onCheckedChange={(checked) => onChange('verified', !!checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="verified"
                    className="text-sm font-medium leading-none flex items-center gap-1"
                  >
                    <Shield className="h-4 w-4" />
                    Проверенный магазин
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Проверенные магазины отображаются с отметкой проверки
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onSave}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoreEditDialog;
