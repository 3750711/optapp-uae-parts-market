
import React from 'react';
import { Store, Activity, Plus, Car, FileText } from 'lucide-react';
import ActionCard from './ActionCard';

const AdminActionsSection: React.FC = () => {
  const actions = [
    {
      title: "Добавить объявление",
      subtitle: "Создать новое объявление",
      icon: Plus,
      link: "/admin/add-product",
      bgColor: "bg-primary", // Changed from bg-optapp-yellow to primary color
      textColor: "text-primary-foreground" // Changed to make text stand out better
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
      bgColor: "bg-optapp-yellow",
      textColor: "text-optapp-dark"
    },
    {
      title: "Создать свободный заказ",
      subtitle: "Создать заказ без привязки к объявлению",
      icon: FileText,
      link: "/admin/free-order",
      bgColor: "bg-green-500",
      textColor: "text-white"
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
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
