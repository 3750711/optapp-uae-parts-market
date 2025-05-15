
import React from 'react';
import { Store, Activity, Plus } from 'lucide-react';
import ActionCard from './ActionCard';

const AdminActionsSection: React.FC = () => {
  const actions = [
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
      title: "Добавить объявление",
      subtitle: "Создать новое объявление",
      icon: Plus,
      link: "/admin/add-product",
      bgColor: "bg-optapp-yellow",
      textColor: "text-optapp-dark"
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
