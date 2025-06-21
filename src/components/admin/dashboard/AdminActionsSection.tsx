
import React from 'react';
import { Store, Activity, Plus, Car, FileText, Package } from 'lucide-react';
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
