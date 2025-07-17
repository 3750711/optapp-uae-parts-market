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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Image, Users, User } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  telegram?: string;
  user_type: 'buyer' | 'seller' | 'admin';
  verification_status: 'pending' | 'verified' | 'blocked';
  opt_status: 'free_user' | 'opt_user';
}

interface MessageConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  messageText: string;
  selectedRecipients: UserProfile[];
  selectedGroup: string | null;
  imageUrls: string[];
  isLoading?: boolean;
}

const MessageConfirmDialog: React.FC<MessageConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  messageText,
  selectedRecipients,
  selectedGroup,
  imageUrls,
  isLoading = false
}) => {
  const getGroupLabel = (group: string) => {
    const groupLabels = {
      all_users: 'Все пользователи',
      sellers: 'Продавцы',
      buyers: 'Покупатели',
      verified_users: 'Верифицированные',
      pending_users: 'Ожидающие верификации',
      opt_users: 'ОПТ пользователи'
    };
    return groupLabels[group as keyof typeof groupLabels] || group;
  };

  const getRecipientCount = () => {
    if (selectedGroup) {
      return `Группа: ${getGroupLabel(selectedGroup)}`;
    }
    return `${selectedRecipients.length} получател${selectedRecipients.length === 1 ? 'ь' : 'ей'}`;
  };

  const messageWithSignature = `${messageText}\n\n📩 Сообщение от администратора partsbay.ae`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Подтверждение отправки сообщения
          </DialogTitle>
          <DialogDescription>
            Проверьте сообщение перед отправкой
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Recipients */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {selectedGroup ? (
                    <Users className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                  <span className="font-medium">Получатели</span>
                  <Badge variant="secondary">{getRecipientCount()}</Badge>
                </div>

                {selectedGroup ? (
                  <p className="text-sm text-muted-foreground">
                    Сообщение будет отправлено всем пользователям в группе "{getGroupLabel(selectedGroup)}"
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedRecipients.slice(0, 5).map((recipient) => (
                      <div key={recipient.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">
                          {recipient.full_name || recipient.email}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {recipient.user_type}
                        </Badge>
                      </div>
                    ))}
                    {selectedRecipients.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        ... и еще {selectedRecipients.length - 5} получателей
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Preview */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Send className="h-4 w-4 text-primary" />
                  <span className="font-medium">Текст сообщения</span>
                </div>
                <div className="bg-muted/50 p-3 rounded border-l-4 border-primary">
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {messageWithSignature}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            {imageUrls.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Image className="h-4 w-4 text-primary" />
                    <span className="font-medium">Изображения</span>
                    <Badge variant="secondary">{imageUrls.length}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={url}
                          alt={`Изображение ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Отменить
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Отправляется...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Отправить сообщение
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageConfirmDialog;