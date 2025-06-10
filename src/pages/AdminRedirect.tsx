
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { Loader2 } from 'lucide-react';

const AdminRedirect = () => {
  const { isAdmin, isChecking, hasAdminAccess } = useAdminGuard(false);

  // Логируем попытку доступа к админ панели
  useEffect(() => {
    console.log('AdminRedirect: Redirecting from /admin to /admin/dashboard');
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return <Navigate to="/profile" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
};

export default AdminRedirect;
