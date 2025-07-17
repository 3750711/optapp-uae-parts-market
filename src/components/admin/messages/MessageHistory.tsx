import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Search, MessageSquare, CheckCircle, XCircle, Clock, Image, User, Send, Radio, RefreshCw } from 'lucide-react';
import { useNewMessageHistory } from '@/hooks/useNewMessageHistory';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const MessageHistory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const {
    messages,
    isLoading,
    stats,
    isLive,
    refreshHistory
  } = useNewMessageHistory({ searchQuery, statusFilter });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'partial_failure':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="text-green-700 bg-green-50">Завершено</Badge>;
      case 'failed':
        return <Badge variant="destructive">Ошибка</Badge>;
      case 'partial_failure':
        return <Badge variant="destructive" className="bg-orange-100 text-orange-700">Частично</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-700 bg-blue-50">В обработке</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  const getRecipientText = (message: any) => {
    if (message.recipient_group) {
      const groupLabels = {
        all_users: 'Все пользователи',
        sellers: 'Продавцы',
        buyers: 'Покупатели',
        verified_users: 'Верифицированные',
        pending_users: 'Ожидающие верификации',
        opt_users: 'ОПТ пользователи'
      };
      return groupLabels[message.recipient_group as keyof typeof groupLabels] || message.recipient_group;
    }
    
    if (message.recipientDetails?.length) {
      if (message.recipientDetails.length === 1) {
        const recipient = message.recipientDetails[0];
        return recipient.full_name || recipient.email || recipient.telegram || 'Неизвестный получатель';
      }
      return `${message.recipientDetails.length} получател${message.recipientDetails.length === 1 ? 'ь' : 'ей'}`;
    }
    
    if (message.recipient_ids?.length) {
      if (message.recipient_ids.length === 1) {
        return '1 получатель';
      }
      return `${message.recipient_ids.length} получател${message.recipient_ids.length === 1 ? 'ь' : 'ей'}`;
    }
    
    return 'Неизвестно';
  };

  const getDetailedRecipientText = (message: any) => {
    if (message.recipient_group) {
      return getRecipientText(message);
    }
    
    if (message.recipientDetails?.length) {
      const names = message.recipientDetails
        .map((r: any) => r.full_name || r.email || r.telegram)
        .filter(Boolean)
        .slice(0, 3);
      
      if (names.length === 0) return `${message.recipient_ids?.length || 0} получателей`;
      
      let text = names.join(', ');
      if (message.recipientDetails.length > 3) {
        text += ` и еще ${message.recipientDetails.length - 3}`;
      }
      return text;
    }
    
    return 'Неизвестно';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">История сообщений</span>
            <span className="sm:hidden">История</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Radio className={`h-3 w-3 ${isLive ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
            <span className="text-xs text-muted-foreground">
              {isLive ? 'Онлайн' : 'Оффлайн'}
            </span>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-lg sm:text-xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Всего</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-lg sm:text-xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Завершено</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <div className="text-lg sm:text-xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Ошибок</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="text-lg sm:text-xl font-bold text-blue-600">{stats.processing}</div>
            <div className="text-xs text-muted-foreground">В работе</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-3 sm:px-6 space-y-4">
        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по тексту сообщения..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Статус доставки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="completed">Завершено</SelectItem>
                <SelectItem value="processing">В обработке</SelectItem>
                <SelectItem value="failed">Ошибки</SelectItem>
                <SelectItem value="partial_failure">Частичные ошибки</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshHistory} 
              className="text-sm gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
          </div>
        </div>

        {/* Message List */}
        <ScrollArea className="h-80 sm:h-96">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
              <p className="mt-4 text-sm">Загрузка истории...</p>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="p-2 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Send className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                          От: {message.senderName || 'Система'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="font-medium text-xs sm:text-sm truncate" title={getDetailedRecipientText(message)}>
                          {getRecipientText(message)}
                        </span>
                        {getStatusIcon(message.status)}
                      </div>
                    </div>
                    {getStatusBadge(message.status)}
                  </div>
                  
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                    {message.message_text}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="whitespace-nowrap">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: ru
                        })}
                      </span>
                      {message.image_urls?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          <span>{message.image_urls.length}</span>
                        </div>
                      )}
                      {message.status !== 'processing' && (
                        <span className="text-green-600">
                          ✓ {message.sent_count || 0}
                        </span>
                      )}
                      {message.failed_count > 0 && (
                        <span className="text-red-600">
                          ✗ {message.failed_count}
                        </span>
                      )}
                      {/* Show Telegram ID missing count */}
                      {message.error_details?.summary?.no_telegram > 0 && (
                        <span className="text-orange-600">
                          📵 {message.error_details.summary.no_telegram}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {/* Show specific error types */}
                      {message.error_details?.summary?.no_telegram > 0 && (
                        <span className="text-orange-500 text-xs">
                          Нет Telegram ID: {message.error_details.summary.no_telegram}
                        </span>
                      )}
                      {message.error_details?.send_failures?.length > 0 && (
                        <span className="text-red-500 text-xs truncate max-w-32">
                          Ошибки отправки: {message.error_details.send_failures.length}
                        </span>
                      )}
                      {/* Show first error from send failures if exists */}
                      {message.error_details?.send_failures?.[0]?.error && (
                        <span className="text-red-500 text-xs truncate max-w-24 sm:max-w-32" title={message.error_details.send_failures[0].error}>
                          {message.error_details.send_failures[0].error}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">История сообщений пуста</p>
              <p className="text-xs mt-1">Отправленные сообщения будут отображаться здесь</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MessageHistory;