import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Search, MessageSquare, CheckCircle, XCircle, Clock, Image, User, Send, Radio } from 'lucide-react';
import { useMessageHistory } from '@/hooks/useMessageHistory';
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
  } = useMessageHistory({ searchQuery, statusFilter });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="text-green-700 bg-green-50">Доставлено</Badge>;
      case 'failed':
        return <Badge variant="destructive">Ошибка</Badge>;
      default:
        return <Badge variant="outline">В обработке</Badge>;
    }
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
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Всего</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-xs text-muted-foreground">Отправлено</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Ошибок</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-3 sm:px-6 space-y-4">
        {/* Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
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
                <SelectItem value="success">Доставлено</SelectItem>
                <SelectItem value="failed">Ошибка</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm" onClick={refreshHistory} className="text-sm">
              Обновить
            </Button>
          </div>
        </div>

        {/* Message List */}
        <ScrollArea className="h-80 sm:h-96">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Загрузка истории...
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
                        <span className="font-medium text-xs sm:text-sm truncate">
                          Кому: {message.recipientName || 'Неизвестный пользователь'}
                        </span>
                        {getStatusIcon(message.details.status)}
                      </div>
                    </div>
                    {getStatusBadge(message.details.status)}
                  </div>
                  
                  <div className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                    {message.details.messageText}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="whitespace-nowrap">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: ru
                        })}
                      </span>
                      {message.details.imageCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Image className="h-3 w-3" />
                          <span>{message.details.imageCount}</span>
                        </div>
                      )}
                    </div>
                    {message.details.error && (
                      <span className="text-red-500 text-xs truncate max-w-24 sm:max-w-32">
                        {message.details.error}
                      </span>
                    )}
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