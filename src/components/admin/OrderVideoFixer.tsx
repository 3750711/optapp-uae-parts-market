
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrderVideoFix } from '@/hooks/useOrderVideoFix';

export const OrderVideoFixer: React.FC = () => {
  const { fixSpecificOrders, isFixing } = useOrderVideoFix();

  const handleFixOrders = async () => {
    console.log('🔧 Manual fix initiated for orders #7545 and #7546');
    await fixSpecificOrders();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Исправление видео в заказах</CardTitle>
        <CardDescription>
          Исправить видео в заказах #7545 и #7546
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleFixOrders} 
          disabled={isFixing}
          className="w-full"
        >
          {isFixing ? 'Исправляю...' : 'Исправить заказы #7545 и #7546'}
        </Button>
      </CardContent>
    </Card>
  );
};
