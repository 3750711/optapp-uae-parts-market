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
  user_type: string;
  verification_status: string;
  opt_status: string;
}

interface MessageComposerProps {
  selectedRecipients: UserProfile[];
  selectedGroup: string;
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
    const files = event.target.files;
    if (!files) return;

    const newImages = Array.from(files).map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages].slice(0, 10)); // Limit to 10 images
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
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Получатели:</span>
          <Badge variant={hasRecipients ? "default" : "outline"}>
            {hasRecipients ? getSelectionSummary() : "Не выбраны"}
          </Badge>
        </div>

        {/* Message Text */}
        <div>
          <Label htmlFor="messageText">Текст сообщения</Label>
          <Textarea
            id="messageText"
            placeholder="Введите текст сообщения..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={4}
            className="mt-2"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {messageText.length}/4096 символов
            </span>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <Label>Изображения (опционально)</Label>
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
              className="inline-flex items-center gap-2 cursor-pointer bg-background border border-input rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Image className="h-4 w-4" />
              Добавить изображения ({images.length}/10)
            </Label>
          </div>
          
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-20 object-cover rounded-md"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
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
          className="w-full"
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