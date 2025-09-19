import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import TelegramAccountsManager from '@/components/admin/TelegramAccountsManager';

const AdminSettings: React.FC = () => {
  const [telegramManagerOpen, setTelegramManagerOpen] = useState(false);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold mb-6 text-foreground">
            Настройки администратора
          </h1>
          
          <Button
            onClick={() => setTelegramManagerOpen(true)}
            variant="outline"
            className="flex items-start space-x-3 p-4 sm:p-6 h-auto justify-start bg-card hover:bg-accent transition-colors w-full text-left border border-border/50 hover:border-border min-h-[72px] touch-target"
          >
            <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm sm:text-base text-foreground">
                Отражения телеграмов продавцев
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Выбор продавцов, чьи телеграм аккаунты показывать в телеграм оповещениях
              </p>
            </div>
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex items-start space-x-3 p-4 sm:p-6 h-auto justify-start bg-card hover:bg-accent transition-colors w-full text-left border border-border/50 hover:border-border min-h-[72px] touch-target"
          >
            <a href="/admin/monitoring/free-order-upload">
              <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-foreground">
                  Мониторинг загрузки фото в свободном заказе
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                  Просмотр логов и статистики загрузки фотографий
                </p>
              </div>
            </a>
          </Button>
        </div>
      </div>

      <TelegramAccountsManager 
        open={telegramManagerOpen}
        onClose={() => setTelegramManagerOpen(false)}
      />
    </AdminLayout>
  );
};

export default AdminSettings;