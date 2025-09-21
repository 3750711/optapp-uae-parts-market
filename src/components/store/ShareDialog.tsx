import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  Copy, 
  MessageCircle, 
  Send, 
  ExternalLink, 
  Clock,
  Eye,
  EyeOff 
} from 'lucide-react';
import { usePublicStoreShare } from '@/hooks/usePublicStoreShare';
import { toast } from 'sonner';

interface ShareDialogProps {
  storeId: string;
  storeName: string;
  currentShareEnabled?: boolean;
  currentShareExpiresAt?: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  storeId,
  storeName,
  currentShareEnabled = false,
  currentShareExpiresAt
}) => {
  const [open, setOpen] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string>('');
  const { 
    generatePublicLink, 
    disablePublicAccess, 
    getShareUrls, 
    isGenerating, 
    isDisabling 
  } = usePublicStoreShare();

  const handleGenerateLink = async () => {
    try {
      const result = await generatePublicLink(storeId);
      setPublicUrl(result.url);
    } catch (error) {
      console.error('Error generating link:', error);
    }
  };

  const handleDisableAccess = async () => {
    try {
      await disablePublicAccess(storeId);
      setPublicUrl('');
      setOpen(false);
    } catch (error) {
      console.error('Error disabling access:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Ссылка скопирована!');
    } catch (error) {
      toast.error('Ошибка копирования');
    }
  };

  const shareUrls = publicUrl ? getShareUrls(publicUrl) : null;
  const isExpired = currentShareExpiresAt ? new Date(currentShareExpiresAt) < new Date() : false;
  const hasActiveShare = currentShareEnabled && !isExpired;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Поделиться
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Поделиться магазином
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">{storeName}</p>
            <p>Создайте публичную ссылку для расшаривания в WhatsApp и Telegram</p>
          </div>

          {/* Current status */}
          {hasActiveShare && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Публичный доступ активен
                </span>
              </div>
              {currentShareExpiresAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-700">
                    Действует до: {new Date(currentShareExpiresAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              )}
            </div>
          )}

          {isExpired && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Срок действия ссылки истек
                </span>
              </div>
            </div>
          )}

          {!hasActiveShare && !isExpired && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">
                  Публичный доступ отключен
                </span>
              </div>
            </div>
          )}

          {/* Generate/Regenerate button */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleGenerateLink} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>Создание ссылки...</>
              ) : hasActiveShare ? (
                <>Обновить ссылку</>
              ) : (
                <>Создать публичную ссылку</>
              )}
            </Button>
            
            {hasActiveShare && (
              <Button 
                variant="outline" 
                onClick={handleDisableAccess}
                disabled={isDisabling}
                className="w-full"
              >
                {isDisabling ? 'Отключение...' : 'Отключить публичный доступ'}
              </Button>
            )}
          </div>

          {/* Share options */}
          {publicUrl && shareUrls && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <Label className="text-sm font-medium">Поделиться в:</Label>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(shareUrls.whatsapp, '_blank')}
                    className="gap-2 justify-start"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(shareUrls.telegram, '_blank')}
                    className="gap-2 justify-start"
                  >
                    <Send className="w-4 h-4" />
                    Telegram
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Публичная ссылка:</Label>
                  <div className="flex gap-2">
                    <Input
                      value={publicUrl}
                      readOnly
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(publicUrl)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <p className="font-medium mb-1">Что увидят посетители:</p>
                    <ul className="space-y-1">
                      <li>• Название и описание магазина</li>
                      <li>• Активные товары без контактов</li>
                      <li>• Призыв к регистрации</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;