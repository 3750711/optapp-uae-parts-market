import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Save, AlertTriangle, Users, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TelegramAccount {
  id: string;
  telegram_username: string;
  is_local: boolean;
  created_at: string;
  updated_at: string;
}

interface Seller {
  id: string;
  full_name: string;
  telegram: string;
  user_type: string;
}

interface TelegramAccountsManagerProps {
  open: boolean;
  onClose: () => void;
}

const TelegramAccountsManager: React.FC<TelegramAccountsManagerProps> = ({ open, onClose }) => {
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load current telegram accounts config
      const { data: accountsData, error: accountsError } = await supabase
        .from('telegram_accounts_config')
        .select('*')
        .order('telegram_username');

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Load all sellers from profiles
      const { data: sellersData, error: sellersError } = await supabase
        .from('profiles')
        .select('id, full_name, telegram, user_type')
        .eq('user_type', 'seller')
        .not('telegram', 'is', null)
        .order('full_name');

      if (sellersError) throw sellersError;
      setSellers(sellersData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const normalizeUsername = (username: string) => {
    return username?.toLowerCase().replace('@', '') || '';
  };

  const isAccountLocal = (telegram: string) => {
    const normalized = normalizeUsername(telegram);
    return accounts.some(acc => 
      normalizeUsername(acc.telegram_username) === normalized && acc.is_local
    );
  };

  const toggleAccount = async (telegram: string) => {
    if (!telegram) return;

    const normalized = normalizeUsername(telegram);
    const existingAccount = accounts.find(acc => 
      normalizeUsername(acc.telegram_username) === normalized
    );

    try {
      if (existingAccount) {
        // Update existing account
        const { error } = await supabase.functions.invoke('manage-telegram-accounts', {
          body: {
            action: 'update',
            id: existingAccount.id,
            is_local: !existingAccount.is_local
          }
        });

        if (error) throw error;

        setAccounts(prev => prev.map(acc => 
          acc.id === existingAccount.id 
            ? { ...acc, is_local: !acc.is_local }
            : acc
        ));
      } else {
        // Create new account
        const { data, error } = await supabase.functions.invoke('manage-telegram-accounts', {
          body: {
            action: 'create',
            telegram_username: normalized,
            is_local: true
          }
        });

        if (error) throw error;

        setAccounts(prev => [...prev, data]);
      }

      toast.success('Настройки обновлены');
    } catch (error) {
      console.error('Error toggling account:', error);
      toast.error('Ошибка при обновлении настроек');
    }
  };

  const filteredSellers = sellers.filter(seller => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      seller.full_name?.toLowerCase().includes(term) ||
      seller.telegram?.toLowerCase().includes(term)
    );
  });

  const localCount = accounts.filter(acc => acc.is_local).length;
  const sellersWithTelegram = sellers.filter(s => s.telegram).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Управление отражениями Telegram аккаунтов продавцов
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Всего продавцов
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sellersWithTelegram}</div>
                <p className="text-xs text-muted-foreground">с Telegram</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Локальные
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{localCount}</div>
                <p className="text-xs text-muted-foreground">показывают реальный @</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Переадресация
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {sellersWithTelegram - localCount}
                </div>
                <p className="text-xs text-muted-foreground">на @Nastya...</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или Telegram..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sellers List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Загрузка...
                </div>
              ) : filteredSellers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Продавцы не найдены
                </div>
              ) : (
                filteredSellers.map(seller => {
                  const isLocal = isAccountLocal(seller.telegram);
                  
                  return (
                    <Card key={seller.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{seller.full_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <MessageCircle className="h-3 w-3" />
                            @{normalizeUsername(seller.telegram)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              isLocal 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-orange-500/10 text-orange-500'
                            }`}>
                              {isLocal ? 'Показывает реальный @' : 'Переадресация на @Nastya...'}
                            </div>
                          </div>
                          
                          <Checkbox
                            checked={isLocal}
                            onCheckedChange={() => toggleAccount(seller.telegram)}
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Локальные аккаунты будут показывать свой реальный Telegram вместо переадресации
            </div>
            <Button onClick={onClose} variant="outline">
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramAccountsManager;