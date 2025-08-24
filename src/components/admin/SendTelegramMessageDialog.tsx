import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileType } from '@/components/profile/types';
import { useAdminUsersActions } from '@/hooks/useAdminUsersActions';

interface SendTelegramMessageDialogProps {
  user: ProfileType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SendTelegramMessageDialog: React.FC<SendTelegramMessageDialogProps> = ({
  user,
  open,
  onOpenChange
}) => {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const { sendPersonalTelegramMessage } = useAdminUsersActions();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 10) {
      toast.error('Максимум 10 изображений');
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Файл ${file.name} слишком большой (максимум 10MB)`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'ml_default');

        const response = await fetch(
          'https://api.cloudinary.com/v1_1/dxhvltszd/image/upload',
          {
            method: 'POST',
            body: formData,
          }
        );

        if (response.ok) {
          const result = await response.json();
          uploadedUrls.push(result.secure_url);
        } else {
          toast.error(`Ошибка загрузки файла ${file.name}`);
        }
      }

      setImages(prev => [...prev, ...uploadedUrls]);
      if (uploadedUrls.length > 0) {
        toast.success(`Загружено изображений: ${uploadedUrls.length}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки изображений');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Введите текст сообщения');
      return;
    }

    setSending(true);

    try {
      const success = await sendPersonalTelegramMessage(
        user.id,
        message.trim(),
        images.length > 0 ? images : undefined
      );

      if (success) {
        setMessage('');
        setImages([]);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Ошибка отправки сообщения');
    } finally {
      setSending(false);
    }
  };

  const canSend = message.trim() && !sending && !uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Отправить сообщение в Telegram
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Пользователь: <span className="font-medium">{user.full_name || user.email}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Сообщение</Label>
            <Textarea
              id="message"
              placeholder="Введите ваше сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <Label>Изображения (опционально)</Label>
            <div className="mt-2">
              <Button
                type="button"
                variant="outline"
                disabled={uploading || images.length >= 10}
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg relative w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Добавить изображения ({images.length}/10)
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,image/heic,image/heif"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading || images.length >= 10}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Изображение ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSend}
              className="flex-1"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отправка...
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