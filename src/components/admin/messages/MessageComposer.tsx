import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Image, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBulkMessaging } from '@/hooks/useBulkMessaging';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  telegram?: string;
  user_type: 'buyer' | 'seller' | 'admin';
  verification_status: 'pending' | 'verified' | 'blocked';
  opt_status: 'free_user' | 'opt_user';
}

interface MessageComposerProps {
  selectedRecipients: UserProfile[];
  selectedGroup: string | null;
  getSelectionSummary: () => string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  selectedRecipients,
  selectedGroup,
  getSelectionSummary
}) => {
  const [messageText, setMessageText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const { toast } = useToast();
  
  const { sendBulkMessage, isLoading, progress } = useBulkMessaging();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (images.length + files.length > 10) {
      toast({
        title: "Ошибка",
        description: "Максимум 10 изображений",
        variant: "destructive",
      });
      return;
    }

    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ошибка",
          description: `Файл ${file.name} не является изображением`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: `Файл ${file.name} слишком большой (максимум 10MB)`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setImages(prev => [...prev, base64]);
      };
      reader.onerror = () => {
        toast({
          title: "Ошибка",
          description: `Не удалось загрузить файл ${file.name}`,
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст сообщения",
        variant: "destructive"
      });
      return;
    }

    if (selectedRecipients.length === 0 && !selectedGroup) {
      toast({
        title: "Ошибка", 
        description: "Выберите получателей сообщения",
        variant: "destructive"
      });
      return;
    }

    try {
      const recipients = selectedGroup 
        ? selectedGroup 
        : selectedRecipients.map(r => r.id);

      const result = await sendBulkMessage({
        recipients,
        messageText,
        images
      });

      toast({
        title: "Сообщения отправлены",
        description: `Успешно: ${result.sent}, Ошибок: ${result.failed}`,
      });

      // Clear form after successful send
      setMessageText('');
      setImages([]);
      
    } catch (error) {
      console.error('Error sending bulk message:', error);
      toast({
        title: "Ошибка отправки",
        description: "Не удалось отправить сообщения",
        variant: "destructive"
      });
    }
  };

  const hasRecipients = selectedRecipients.length > 0 || selectedGroup;
  const canSend = messageText.trim() && hasRecipients && !isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Создать сообщение
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipients Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Получатели:</span>
          <Badge variant={hasRecipients ? "default" : "outline"} className="self-start sm:self-auto">
            {hasRecipients ? getSelectionSummary() : "Не выбраны"}
          </Badge>
        </div>

        {/* Message Text */}
        <div>
          <Label htmlFor="messageText" className="text-sm">Текст сообщения</Label>
          <Textarea
            id="messageText"
            placeholder="Введите текст сообщения..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={3}
            className="mt-2 text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {messageText.length}/4096 символов
            </span>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <Label className="text-sm">
            Изображения (до 10 штук, максимум 10MB каждое)
          </Label>
          <div className="mt-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={images.length >= 10}
            />
            <Label
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 cursor-pointer bg-background border border-input rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground w-full sm:w-auto justify-center sm:justify-start"
            >
              <Image className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Добавить изображения ({images.length}/10)</span>
            </Label>
          </div>
          
          {images.length > 0 && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-2">
                {images.length}/10 изображений
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-16 sm:h-20 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Отправка сообщений...</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Warning */}
        {!hasRecipients && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Выберите получателей для отправки сообщения</span>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSendMessage}
          disabled={!canSend}
          className="w-full text-sm sm:text-base py-2 sm:py-3"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Отправить сообщение
        </Button>
      </CardContent>
    </Card>
  );
};

export default MessageComposer;