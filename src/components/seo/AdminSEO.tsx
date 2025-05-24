
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface AdminSEOProps {
  title: string;
  description?: string;
  section?: string;
}

const AdminSEO: React.FC<AdminSEOProps> = ({
  title,
  description = 'Панель администратора OptUAE - управление магазинами, товарами и пользователями',
  section
}) => {
  const fullTitle = section ? `${title} - ${section} | Админ OptUAE` : `${title} | Админ OptUAE`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="noindex, nofollow" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Helmet>
  );
};

export default AdminSEO;
