import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import TelegramAccountsManager from '@/components/admin/TelegramAccountsManager';

const AdminSettings: React.FC = () => {
  const [telegramManagerOpen, setTelegramManagerOpen] = useState(false);

  return (
    <AdminLayout>
      <div className="p-6">
        <Button
          onClick={() => setTelegramManagerOpen(true)}
          variant="outline"
          className="flex items-center space-x-3 p-3 h-auto justify-start bg-card hover:bg-accent"
        >
          <MessageCircle className="h-5 w-5 text-primary" />
          <div className="text-left">
            <p className="font-medium">Отражения телеграмов продавцев</p>
            <p className="text-sm text-muted-foreground">Управление локальными аккаунтами</p>
          </div>
        </Button>
      </div>

      <TelegramAccountsManager 
        open={telegramManagerOpen}
        onClose={() => setTelegramManagerOpen(false)}
      />
    </AdminLayout>
  );
};

export default AdminSettings;