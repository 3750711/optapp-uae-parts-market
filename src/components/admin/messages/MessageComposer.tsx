import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Image, Loader2, AlertCircle, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBulkMessaging } from '@/hooks/useBulkMessaging';
import { useMessageImageUpload } from '@/hooks/useMessageImageUpload';
import MessageConfirmDialog from './MessageConfirmDialog';

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
  refreshHistory?: () => void;
}

const MessageComposer: React.FC<MessageComposerProps> = ({
  selectedRecipients,
  selectedGroup,
  getSelectionSummary,
  refreshHistory
}) => {
  const [messageText, setMessageText] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  
  const { sendBulkMessage, isLoading, progress } = useBulkMessaging();
  const { 
    uploadMessageImages, 
    uploadQueue, 
    isUploading,
    getPreviewUrls,
    getFinalUrls,
    removeImage,
    clearImages
  } = useMessageImageUpload();

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите файлы изображений",
        variant: "destructive"
      });
      return;
    }

    if (imageFiles.length > 10) {
      toast({
        title: "Слишком много файлов",
        description: "Максимум 10 изображений за раз",
        variant: "destructive"
      });
      return;
    }

    // Upload images to Cloudinary
    await uploadMessageImages(imageFiles);

    // Reset input
    event.target.value = '';
  }, [uploadMessageImages, toast]);

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

    // Check if images are still uploading
    if (isUploading) {
      toast({
        title: "Подождите",
        description: "Дождитесь завершения загрузки изображений",
        variant: "destructive"
      });
      return;
    }

    // Check if all uploaded images have final URLs
    const hasFailedUploads = uploadQueue.some(item => item.status === 'error');
    if (hasFailedUploads) {
      toast({
        title: "Ошибка загрузки",
        description: "Некоторые изображения не удалось загрузить. Удалите их или попробуйте еще раз",
        variant: "destructive"
      });
      return;
    }

    // Check if there are images still processing
    const hasProcessingImages = uploadQueue.some(item => 
      item.status === 'pending' || item.status === 'compressing' || item.status === 'uploading'
    );
    if (hasProcessingImages) {
      toast({
        title: "Подождите",
        description: "Дождитесь завершения обработки всех изображений",
        variant: "destructive"
      });
      return;
    }

    console.log('📤 Sending message with images:', {
      messageLength: messageText.length,
      imageUrls: getFinalUrls(),
      uploadQueueStatus: uploadQueue.map(item => ({ 
        name: item.file.name, 
        status: item.status, 
        finalUrl: item.finalUrl 
      }))
    });

    // Open confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    try {
      const recipients = selectedGroup 
        ? selectedGroup 
        : selectedRecipients.map(r => r.id);

      // Get uploaded image URLs
      const imageUrls = getFinalUrls();

      const result = await sendBulkMessage({
        recipients,
        messageText,
        images: imageUrls
      });

      toast({
        title: "Сообщения отправлены",
        description: `Успешно: ${result.sent}, Ошибок: ${result.failed}`,
      });

      // Clear form after successful send
      setMessageText('');
      setShowConfirmDialog(false);
      
      // Clear uploaded images using the new clearImages function
      clearImages();
      
      // Force refresh message history after delay to ensure Edge Function completes
      if (refreshHistory) {
        console.log('🔄 Triggering message history refresh after send');
        setTimeout(() => {
          refreshHistory();
        }, 2000);
        
        // Auto-refresh again after 30 seconds to catch any delayed status updates
        setTimeout(() => {
          console.log('🔄 Auto-refresh message history for final status update');
          refreshHistory();
        }, 30000);
      }
      
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
  const hasFailedUploads = uploadQueue.some(item => item.status === 'error');
  const hasProcessingImages = uploadQueue.some(item => 
    item.status === 'pending' || item.status === 'compressing' || item.status === 'uploading'
  );
  const canSend = messageText.trim() && hasRecipients && !isLoading && !isUploading && !hasFailedUploads && !hasProcessingImages;

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
        <div className="space-y-3">
          <Label className="text-sm">
            Изображения (до 10 штук, максимум 20MB каждое)
          </Label>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={isUploading}
              className="gap-2 w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Добавить изображения
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              {getPreviewUrls().length}/10 изображений
            </span>
          </div>

          {/* Upload Progress */}
          {uploadQueue.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка изображений...
                  </>
                ) : (
                  hasFailedUploads ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Ошибки загрузки
                    </>
                  ) : (
                    hasProcessingImages ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Обработка изображений...
                      </>
                    ) : (
                      "Изображения готовы"
                    )
                  )
                )}
              </div>
              {uploadQueue.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{item.file.name}</span>
                    <span className={
                      item.status === 'error' ? 'text-red-500' : 
                      item.status === 'success' ? 'text-green-500' : 
                      'text-muted-foreground'
                    }>
                      {item.status === 'pending' && 'Ожидание...'}
                      {item.status === 'compressing' && 'Сжатие...'}
                      {item.status === 'uploading' && `${item.progress}%`}
                      {item.status === 'success' && '✓ Готово'}
                      {item.status === 'error' && '✗ Ошибка'}
                    </span>
                  </div>
                  {item.status !== 'success' && item.status !== 'error' && (
                    <Progress value={item.progress} className="h-1" />
                  )}
                  {item.status === 'error' && item.error && (
                    <div className="text-xs text-red-500">{item.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Image Previews */}
          {getPreviewUrls().length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {getPreviewUrls().map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-16 sm:h-20 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  {uploadQueue[index]?.status === 'success' && (
                    <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-1">
                      <Image className="h-3 w-3" />
                    </div>
                  )}
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

        {/* Warnings */}
        {!hasRecipients && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Выберите получателей для отправки сообщения</span>
          </div>
        )}
        
        {hasFailedUploads && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Некоторые изображения не удалось загрузить. Удалите их или попробуйте еще раз</span>
          </div>
        )}

        {hasProcessingImages && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Дождитесь завершения обработки изображений перед отправкой</span>
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
          ) : isUploading || hasProcessingImages ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Отправка...' : 
           isUploading ? 'Загрузка изображений...' : 
           hasProcessingImages ? 'Обработка изображений...' :
           hasFailedUploads ? 'Исправьте ошибки загрузки' :
           'Отправить сообщение'}
        </Button>

        <MessageConfirmDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          onConfirm={handleConfirmSend}
          messageText={messageText}
          selectedRecipients={selectedRecipients}
          selectedGroup={selectedGroup}
          imageUrls={getFinalUrls()}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
};

export default MessageComposer;