import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Shield, Database, Activity, Users, Mail, Key, FileText, Globe, MessageCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import TelegramAccountsManager from '@/components/admin/TelegramAccountsManager';

const AdminSettings: React.FC = () => {
  const [telegramManagerOpen, setTelegramManagerOpen] = useState(false);
  const settingsCategories = [
    {
      title: "Системные настройки",
      description: "Основные параметры системы",
      icon: Settings,
      items: [
        "Общие настройки приложения",
        "Конфигурация базы данных", 
        "Параметры производительности",
        "Настройки кэширования"
      ]
    },
    {
      title: "Уведомления",
      description: "Управление системой уведомлений",
      icon: Bell,
      items: [
        "Telegram уведомления",
        "Email рассылки",
        "Push уведомления",
        "SMS сообщения"
      ]
    },
    {
      title: "Безопасность",
      description: "Настройки безопасности и доступа",
      icon: Shield,
      items: [
        "Политики доступа",
        "Аутентификация",
        "Журналы безопасности",
        "Блокировки и ограничения"
      ]
    },
    {
      title: "Мониторинг",
      description: "Системный мониторинг и аналитика",
      icon: Activity,
      items: [
        "Метрики производительности",
        "Логи системы",
        "Мониторинг ошибок",
        "Статистика использования"
      ]
    },
    {
      title: "Управление пользователями",
      description: "Административное управление пользователями",
      icon: Users,
      items: [
        "Роли и права доступа",
        "Блокировка аккаунтов",
        "Массовые операции",
        "Импорт/экспорт данных"
      ]
    },
    {
      title: "Интеграции",
      description: "Внешние интеграции и API",
      icon: Globe,
      items: [
        "API конфигурация",
        "Внешние сервисы",
        "Webhooks",
        "Синхронизация данных"
      ]
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Административные настройки</h1>
          <p className="text-muted-foreground mt-2">
            Управление системными настройками, безопасностью и конфигурацией приложения
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {settingsCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <category.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">{category.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-muted-foreground flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2 text-orange-500" />
              Важные административные действия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Резервное копирование БД</p>
                  <p className="text-sm text-muted-foreground">Создать бэкап базы данных</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card">
                <FileText className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Экспорт отчетов</p>
                  <p className="text-sm text-muted-foreground">Генерация системных отчетов</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-card">
                <Mail className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Массовая рассылка</p>
                  <p className="text-sm text-muted-foreground">Отправка уведомлений всем</p>
                </div>
              </div>
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
          </CardContent>
        </Card>
      </div>

      <TelegramAccountsManager 
        open={telegramManagerOpen}
        onClose={() => setTelegramManagerOpen(false)}
      />
    </AdminLayout>
  );
};

export default AdminSettings;