
import React from 'react';
import { Store, Activity, Plus, Car, FileText, Package, MessageSquare, DollarSign, CheckSquare, MessageCircle, HelpCircle, Languages, Search, BarChart3, Settings } from 'lucide-react';
import ActionCard from './ActionCard';

const AdminActionsSection: React.FC = () => {
  const actions = [
    {
      title: "Добавить объявление",
      subtitle: "Создать новое объявление",
      icon: Plus,
      link: "/admin/add-product",
      bgColor: "bg-primary",
      textColor: "text-primary-foreground"
    },
    {
      title: "Продать товар",
      subtitle: "Создать заказ на товар",
      icon: Package,
      link: "/admin/sell-product",
      bgColor: "bg-green-500",
      textColor: "text-white"
    },
    {
      title: "Каталог товаров",
      subtitle: "Просмотр всех товаров",
      icon: Search,
      link: "/catalog",
      bgColor: "bg-blue-600",
      textColor: "text-white"
    },
    {
      title: "Статистика продавцов",
      subtitle: "Аналитика по продавцам",
      icon: BarChart3,
      link: "/admin/seller-statistics",
      bgColor: "bg-emerald-500",
      textColor: "text-white"
    },
    {
      title: "Магазины",
      subtitle: "Управление магазинами",
      icon: Store,
      link: "/admin/stores",
    },
    {
      title: "Журнал событий",
      subtitle: "Просмотр журнала системных событий",
      icon: Activity,
      link: "/admin/events",
    },
    {
      title: "Марки и модели",
      subtitle: "Управление каталогом автомобилей",
      icon: Car,
      link: "/admin/car-catalog",
      bgColor: "bg-secondary",
      textColor: "text-secondary-foreground"
    },
    {
      title: "Создать свободный заказ",
      subtitle: "Создать заказ без привязки к объявлению",
      icon: FileText,
      link: "/admin/free-order",
      bgColor: "bg-accent",
      textColor: "text-accent-foreground"
    },
    {
      title: "Сообщения пользователям",
      subtitle: "Отправка сообщений и уведомлений",
      icon: MessageSquare,
      link: "/admin/messages",
      bgColor: "bg-blue-500",
      textColor: "text-white"
    },
    {
      title: "Предложения цен",
      subtitle: "Управление ценовыми предложениями",
      icon: DollarSign,
      link: "/admin/price-offers",
      bgColor: "bg-green-600",
      textColor: "text-white"
    },
    {
      title: "Модерация товаров",
      subtitle: "Проверка и публикация товаров",
      icon: CheckSquare,
      link: "/admin/product-moderation",
      bgColor: "bg-orange-500",
      textColor: "text-white"
    },
    {
      title: "Мониторинг Telegram",
      subtitle: "Отслеживание уведомлений в Telegram",
      icon: MessageCircle,
      link: "/admin/telegram-monitoring",
      bgColor: "bg-purple-500",
      textColor: "text-white"
    },
    {
      title: "Редактировать Help",
      subtitle: "Управление FAQ и страницей помощи",
      icon: HelpCircle,
      link: "/admin/help-editor",
      bgColor: "bg-indigo-500",
      textColor: "text-white"
    },
    {
      title: "Управление синонимами поиска",
      subtitle: "Генерация и управление синонимами",
      icon: Languages,
      link: "/admin/synonyms",
      bgColor: "bg-violet-500",
      textColor: "text-white"
    },
    {
      title: "Административные",
      subtitle: "Системные настройки и конфигурация",
      icon: Settings,
      link: "/admin/settings",
      bgColor: "bg-slate-600",
      textColor: "text-white"
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
      {actions.map((action, index) => (
        <ActionCard
          key={index}
          title={action.title}
          subtitle={action.subtitle}
          icon={action.icon}
          link={action.link}
          bgColor={action.bgColor}
          textColor={action.textColor}
        />
      ))}
    </div>
  );
};

export default AdminActionsSection;
