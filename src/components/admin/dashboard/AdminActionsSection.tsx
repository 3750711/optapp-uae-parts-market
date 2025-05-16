
import React from 'react';
import { Store, Activity, Plus, Car, FileText } from 'lucide-react';
import ActionCard from './ActionCard';
import { useTranslation } from 'react-i18next';

const AdminActionsSection: React.FC = () => {
  const { t } = useTranslation('admin');

  const actions = [
    {
      title: t('admin:dashboard.addProduct'),
      subtitle: t('admin:dashboard.addProductSubtitle'),
      icon: Plus,
      link: "/admin/add-product",
      bgColor: "bg-primary", 
      textColor: "text-primary-foreground" 
    },
    {
      title: t('admin:dashboard.stores'),
      subtitle: t('admin:dashboard.storesSubtitle'),
      icon: Store,
      link: "/admin/stores",
    },
    {
      title: t('admin:dashboard.events'),
      subtitle: t('admin:dashboard.eventsSubtitle'),
      icon: Activity,
      link: "/admin/events",
    },
    {
      title: t('admin:dashboard.carCatalog'),
      subtitle: t('admin:dashboard.carCatalogSubtitle'),
      icon: Car,
      link: "/admin/car-catalog",
      bgColor: "bg-optapp-yellow",
      textColor: "text-optapp-dark"
    },
    {
      title: t('admin:dashboard.freeOrder'),
      subtitle: t('admin:dashboard.freeOrderSubtitle'),
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
