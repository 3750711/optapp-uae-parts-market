import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Phone, Search, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MessageRecipientDetail {
  userId: string;
  userName: string;
  userEmail: string;
  status: 'success' | 'failed' | 'no_telegram_id' | 'processing';
  error?: string;
  deliveredAt?: string;
}

interface MessageDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageText: string;
  recipientIds: string[];
}

const MessageDetails: React.FC<MessageDetailsProps> = ({
  isOpen,
  onClose,
  messageId,
  messageText,
  recipientIds
}) => {
  const [recipients, setRecipients] = useState<MessageRecipientDetail[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<MessageRecipientDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen && messageId) {
      fetchRecipientDetails();
    }
  }, [isOpen, messageId]);

  useEffect(() => {
    let filtered = recipients;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredRecipients(filtered);
  }, [recipients, searchQuery, statusFilter]);

  const fetchRecipientDetails = async () => {
    setIsLoading(true);
    try {
      // Get all profiles for recipients
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, telegram')
        .in('id', recipientIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get event logs for this message
      const { data: eventLogs, error: logsError } = await supabase
        .from('event_logs')
        .select('*')
        .eq('action_type', 'message_sent')
        .eq('entity_type', 'telegram_message')
        .contains('details', { message_id: messageId });

      if (logsError) {
        console.error('Error fetching event logs:', logsError);
      }

      // Create a map of user statuses from event logs
      const statusMap = new Map<string, { status: string; error?: string; deliveredAt?: string }>();
      
      eventLogs?.forEach(log => {
        const recipientId = log.details?.recipient_user_id;
        if (recipientId) {
          statusMap.set(recipientId, {
            status: log.details?.status || 'failed',
            error: log.details?.error,
            deliveredAt: log.created_at
          });
        }
      });

      // Combine profile data with delivery status
      const recipientDetails: MessageRecipientDetail[] = profiles?.map(profile => {
        const deliveryInfo = statusMap.get(profile.id);
        let status: MessageRecipientDetail['status'] = 'processing';
        
        if (deliveryInfo) {
          if (deliveryInfo.status === 'success') {
            status = 'success';
          } else if (deliveryInfo.error === 'no_telegram_id' || !profile.telegram) {
            status = 'no_telegram_id';
          } else {
            status = 'failed';
          }
        } else if (!profile.telegram) {
          status = 'no_telegram_id';
        }

        return {
          userId: profile.id,
          userName: profile.full_name || 'Не указано',
          userEmail: profile.email,
          status,
          error: deliveryInfo?.error,
          deliveredAt: deliveryInfo?.deliveredAt
        };
      }) || [];

      setRecipients(recipientDetails);
    } catch (error) {
      console.error('Error in fetchRecipientDetails:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: MessageRecipientDetail['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'no_telegram_id':
        return <Phone className="h-4 w-4 text-orange-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: MessageRecipientDetail['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="text-green-700 bg-green-50">Доставлено</Badge>;
      case 'no_telegram_id':
        return <Badge variant="outline" className="text-orange-700 bg-orange-50">Нет Telegram ID</Badge>;
      case 'failed':
        return <Badge variant="destructive">Ошибка</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-700 bg-blue-50">В обработке</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  const getStatusText = (status: MessageRecipientDetail['status']) => {
    switch (status) {
      case 'success':
        return 'Сообщение успешно доставлено';
      case 'no_telegram_id':
        return 'У пользователя отсутствует Telegram ID';
      case 'failed':
        return 'Ошибка при отправке сообщения';
      case 'processing':
        return 'Сообщение в процессе доставки';
      default:
        return 'Неизвестный статус';
    }
  };

  const stats = {
    total: recipients.length,
    success: recipients.filter(r => r.status === 'success').length,
    no_telegram: recipients.filter(r => r.status === 'no_telegram_id').length,
    failed: recipients.filter(r => r.status === 'failed').length,
    processing: recipients.filter(r => r.status === 'processing').length
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">Детали доставки сообщения</DialogTitle>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {messageText}
          </div>
        </DialogHeader>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 py-4">
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Всего</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{stats.success}</div>
            <div className="text-xs text-muted-foreground">Доставлено</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-orange-600">{stats.no_telegram}</div>
            <div className="text-xs text-muted-foreground">Нет Telegram</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Ошибок</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{stats.processing}</div>
            <div className="text-xs text-muted-foreground">В процессе</div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Фильтр по статусу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="success">Доставлено</SelectItem>
              <SelectItem value="no_telegram_id">Нет Telegram ID</SelectItem>
              <SelectItem value="failed">Ошибки</SelectItem>
              <SelectItem value="processing">В процессе</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recipients List */}
        <ScrollArea className="flex-1 min-h-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
              <p className="mt-4">Загрузка деталей...</p>
            </div>
          ) : filteredRecipients.length > 0 ? (
            <div className="space-y-2">
              {filteredRecipients.map((recipient) => (
                <div
                  key={recipient.userId}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{recipient.userName}</div>
                        <div className="text-sm text-muted-foreground truncate">{recipient.userEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(recipient.status)}
                      {getStatusBadge(recipient.status)}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {getStatusText(recipient.status)}
                  </div>
                  
                  {recipient.error && recipient.status === 'failed' && (
                    <div className="text-sm text-red-600 mt-1 p-2 bg-red-50 rounded">
                      Ошибка: {recipient.error}
                    </div>
                  )}
                  
                  {recipient.deliveredAt && recipient.status === 'success' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Доставлено: {new Date(recipient.deliveredAt).toLocaleString('ru-RU')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Получатели не найдены</p>
              {searchQuery && <p className="text-sm mt-1">Попробуйте изменить поисковый запрос</p>}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDetails;