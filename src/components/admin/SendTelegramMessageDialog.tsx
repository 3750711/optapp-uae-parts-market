import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProfileType } from '@/components/profile/types';
import { Send, Upload, X, Image } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface SendTelegramMessageDialogProps {
  user: ProfileType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SendTelegramMessageDialog: React.FC<SendTelegramMessageDialogProps> = ({
  user,
  open,
  onOpenChange,
}) => {
  const [messageText, setMessageText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 images total
    const newFiles = files.slice(0, 10 - images.length);
    if (newFiles.length < files.length) {
      toast({
        title: "Предупреждение",
        description: "Можно прикрепить максимум 10 изображений",
        variant: "destructive"
      });
    }

    setIsUploading(true);
    const uploadPromises = newFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'default');

      try {
        const response = await fetch('https://api.cloudinary.com/v1_1/dey9g9vhx/image/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        return result.secure_url;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    });

    try {
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...newFiles]);
      setImageUrls(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображения",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && imageUrls.length === 0) {
      toast({
        title: "Ошибка",
        description: "Введите текст сообщения или прикрепите изображения",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      const { error } = await supabase.functions.invoke('send-personal-telegram-message', {
        body: {
          user_id: user.id,
          message_text: messageText.trim() || undefined,
          images: imageUrls.length > 0 ? imageUrls : undefined
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Успех",
        description: "Сообщение отправлено в Telegram"
      });

      // Reset form
      setMessageText('');
      setImages([]);
      setImageUrls([]);
      onOpenChange(false);

      // Invalidate queries to refresh any logs or stats
      queryClient.invalidateQueries({ queryKey: ['admin'] });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить сообщение",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setMessageText('');
      setImages([]);
      setImageUrls([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Отправить сообщение в Telegram
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Получатель: {user.full_name || user.email}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Текст сообщения</Label>
            <Textarea
              id="message"
              placeholder="Введите ваше сообщение..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="min-h-20"
              disabled={isSending}
            />
          </div>

          <div>
            <Label>Изображения ({images.length}/10)</Label>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={isUploading || isSending || images.length >= 10}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {images.map((file, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
                        <Image className="h-8 w-8 text-muted-foreground" />
                        <span className="absolute inset-0 bg-black/50 text-white text-xs p-1 flex items-center justify-center">
                          {file.name.length > 10 ? file.name.substring(0, 10) + '...' : file.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                        disabled={isSending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={isSending || isUploading || (!messageText.trim() && imageUrls.length === 0)}
            >
              {isSending ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Отправляется...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Отправить
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};