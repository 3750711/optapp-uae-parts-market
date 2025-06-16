
import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2, Upload, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DraftManagementAlertProps {
  draftExists: boolean;
  onLoadDraft: () => void;
  onClearDraft: () => void;
  onDismiss: () => void;
}

const DraftManagementAlert: React.FC<DraftManagementAlertProps> = ({
  draftExists,
  onLoadDraft,
  onClearDraft,
  onDismiss
}) => {
  const [showLoadConfirm, setShowLoadConfirm] = useState(false);

  if (!draftExists) return null;

  const handleLoadDraft = () => {
    onLoadDraft();
    setShowLoadConfirm(false);
    onDismiss();
  };

  return (
    <Alert className="mb-6 bg-blue-50 border-blue-200">
      <AlertCircle className="h-4 w-4 text-blue-700" />
      <AlertTitle className="text-blue-800">Найден сохраненный черновик</AlertTitle>
      <AlertDescription className="text-blue-700 mb-4">
        Обнаружен незавершенный черновик товара. Хотите продолжить его заполнение?
      </AlertDescription>
      
      <div className="flex flex-wrap gap-2">
        <AlertDialog open={showLoadConfirm} onOpenChange={setShowLoadConfirm}>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-1" />
              Загрузить черновик
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Загрузить черновик?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие заполнит форму данными из сохраненного черновика. 
                Текущие изменения в форме будут перезаписаны.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleLoadDraft}>
                Загрузить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-1" />
              Удалить черновик
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить черновик?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие безвозвратно удалит сохраненный черновик. 
                Вы уверены, что хотите продолжить?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  onClearDraft();
                  onDismiss();
                }}
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onDismiss}
          className="text-gray-600 hover:text-gray-800"
        >
          <X className="h-4 w-4 mr-1" />
          Скрыть
        </Button>
      </div>
    </Alert>
  );
};

export default DraftManagementAlert;
