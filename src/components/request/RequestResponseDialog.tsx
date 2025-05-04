
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface RequestResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  requestTitle: string;
  userId: string;
}

const RequestResponseDialog: React.FC<RequestResponseDialogProps> = ({
  open,
  onOpenChange,
  requestId,
  requestTitle,
  userId
}) => {
  const [price, setPrice] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!userId) return;
    
    try {
      setIsSubmitting(true);
      
      // Store the response in the database
      const { error } = await supabase
        .from('request_answers')
        .upsert([
          {
            user_id: userId,
            request_id: requestId,
            response_type: 'have',
            price: price ? parseFloat(price) : null,
            images: images
          }
        ], { onConflict: 'user_id,request_id' });
        
      if (error) {
        console.error('Error saving response:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить ваш ответ",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Успешно!",
        description: "Ваш ответ отправлен. Мы свяжемся с покупателем.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при отправке ответа",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (urls: string[]) => {
    setImages([...images, ...urls]);
  };

  const handleImageDelete = (url: string) => {
    setImages(images.filter(image => image !== url));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Спасибо за ваш ответ!</DialogTitle>
          <DialogDescription>
            Мы пришлем ваши контакты покупателю. Чтобы дать лучшее предложение, 
            вы можете указать цену и добавить фото.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="requestTitle" className="text-sm font-medium">Запрос</Label>
            <div id="requestTitle" className="mt-1 font-medium">
              {requestTitle}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">Ваша цена (опционально)</Label>
            <Input
              id="price"
              type="number"
              placeholder="Укажите вашу цену"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Фотографии (опционально)</Label>
            <ImageUpload
              images={images}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              maxImages={5}
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-between gap-2 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Отменить
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Сохранение..." : "Отправить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestResponseDialog;
