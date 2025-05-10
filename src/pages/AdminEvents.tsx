
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const AdminEvents = () => {
  const { isAdmin } = useAdminAccess();
  const { toast } = useToast();

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Журнал событий</h1>
        </div>
        
        <Card className="p-4">
          <div className="text-center py-8">
            Журнал событий был отключен.
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;
