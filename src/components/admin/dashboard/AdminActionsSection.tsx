
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderVideoFixer } from '@/components/admin/OrderVideoFixer';

export const AdminActionsSection = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Административные действия</CardTitle>
          <CardDescription>Инструменты для управления системой</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Исправление видео в заказах</h3>
              <OrderVideoFixer />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActionsSection;
