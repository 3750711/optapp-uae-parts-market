import AdminLayout from "@/components/admin/AdminLayout";
import { TelegramWebhookManager } from "@/components/admin/telegram/TelegramWebhookManager";

const AdminTelegramSettings = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Настройки Telegram</h1>
          <p className="text-muted-foreground mt-2">
            Управление интеграцией с Telegram Bot
          </p>
        </div>
        
        <TelegramWebhookManager />
      </div>
    </AdminLayout>
  );
};

export default AdminTelegramSettings;
