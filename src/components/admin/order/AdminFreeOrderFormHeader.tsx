
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileOrderCreationHeader } from './MobileOrderCreationHeader';

interface AdminFreeOrderFormHeaderProps {
  title?: string;
  description?: string;
}

export const AdminFreeOrderFormHeader: React.FC<AdminFreeOrderFormHeaderProps> = ({
  title = "Создание свободного заказа",
  description = "Заполните информацию о заказе"
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileOrderCreationHeader
        title={title}
        description={description}
      />
    );
  }

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};
