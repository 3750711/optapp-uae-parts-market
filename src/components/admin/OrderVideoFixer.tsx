
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrderVideoFix } from '@/hooks/useOrderVideoFix';

export const OrderVideoFixer: React.FC = () => {
  const { fixSpecificOrders, fixOrderVideoDuplication, isFixing } = useOrderVideoFix();

  const handleFixOrders = async () => {
    console.log('🔧 Manual fix initiated for orders with video duplication');
    await fixSpecificOrders();
  };

  const handleFixOrder7547 = async () => {
    console.log('🔧 Manual fix initiated for order #7547');
    // Получаем ID заказа 7547
    const orderId = '50de50a7-ed20-4d2a-9bad-ebeb7fa12c20'; // ID заказа #7547
    await fixOrderVideoDuplication(orderId);
  };

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Исправление дублирования видео</CardTitle>
          <CardDescription>
            Исправить дублирование видео в заказе #7547
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleFixOrder7547} 
            disabled={isFixing}
            className="w-full"
          >
            {isFixing ? 'Исправляю...' : 'Исправить заказ #7547'}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Исправление видео в заказах</CardTitle>
          <CardDescription>
            Исправить видео в заказах #7545, #7546 и #7547
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleFixOrders} 
            disabled={isFixing}
            className="w-full"
          >
            {isFixing ? 'Исправляю...' : 'Исправить все заказы'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
