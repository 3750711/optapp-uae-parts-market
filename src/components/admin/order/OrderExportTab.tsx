
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Image, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface OrderExportTabProps {
  order: any;
}

export const OrderExportTab: React.FC<OrderExportTabProps> = ({ order }) => {
  const exportOrderData = () => {
    const orderData = {
      orderNumber: order?.order_number,
      title: order?.title,
      brand: order?.brand,
      model: order?.model,
      price: order?.price,
      status: order?.status,
      createdAt: order?.created_at,
      buyer: order?.buyer,
      seller: order?.seller,
      delivery: {
        method: order?.delivery_method,
        confirmedPrice: order?.delivery_price_confirm
      },
      media: {
        images: order?.images || [],
        videosCount: 0 // Will be populated from order_videos
      }
    };

    const dataStr = JSON.stringify(orderData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-${order?.order_number}-data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Успешно",
      description: "Данные заказа экспортированы",
    });
  };

  const exportOrderReport = () => {
    const reportText = `
ОТЧЕТ ПО ЗАКАЗУ № ${order?.order_number}
=====================================

ОСНОВНАЯ ИНФОРМАЦИЯ:
Наименование: ${order?.title}
Бренд: ${order?.brand}
Модель: ${order?.model}
Цена: $${order?.price}
Статус: ${order?.status}
Дата создания: ${new Date(order?.created_at).toLocaleString('ru-RU')}

ДОСТАВКА:
Способ доставки: ${order?.delivery_method}
Подтвержденная стоимость: $${order?.delivery_price_confirm || 'Не указана'}

ПРОДАВЕЦ:
Имя: ${order?.seller?.full_name || 'Не указано'}
Telegram: ${order?.seller?.telegram || 'Не указано'}
Email: ${order?.seller?.email || 'Не указано'}

ПОКУПАТЕЛЬ:
Имя: ${order?.buyer?.full_name || 'Не указано'}
Telegram: ${order?.buyer?.telegram || 'Не указано'}
Email: ${order?.buyer?.email || 'Не указано'}

МЕДИАФАЙЛЫ:
Количество изображений: ${order?.images?.length || 0}

ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:
${order?.description || 'Нет дополнительной информации'}
`;

    const reportBlob = new Blob([reportText], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(reportBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-${order?.order_number}-report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Успешно",
      description: "Отчет по заказу создан",
    });
  };

  const downloadAllImages = async () => {
    if (!order?.images || order.images.length === 0) {
      toast({
        title: "Предупреждение",
        description: "У заказа нет изображений для скачивания",
        variant: "destructive",
      });
      return;
    }

    try {
      for (let i = 0; i < order.images.length; i++) {
        const imageUrl = order.images[i];
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `order-${order.order_number}-image-${i + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Небольшая задержка между скачиваниями
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Успешно",
        description: `Скачано ${order.images.length} изображений`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скачать все изображения",
        variant: "destructive",
      });
    }
  };

  const exportLogisticsReport = () => {
    const reportText = `
ОТЧЕТ ПО ЗАКАЗУ № ${order?.order_number} - ЛОГИСТИКА
======================================================

ОСНОВНАЯ ИНФОРМАЦИЯ:
Номер заказа: ${order?.order_number}
Наименование: ${order?.title} ${order?.brand} ${order?.model}
Количество мест для отправки: ${order?.place_number}
Стоимость товара: $${order?.price}
Стоимость доставки: $${order?.delivery_price_confirm || 0}

УЧАСТНИКИ:
OPT ID продавца: ${order?.seller?.opt_id || 'Не указано'}
OPT ID покупателя: ${order?.buyer?.opt_id || 'Не указано'}

ЛОГИСТИКА:
Номер контейнера: ${order?.container_number || 'Не указан'}
Статус отгрузки: ${order?.shipment_status ? getShipmentStatusLabel(order.shipment_status) : 'Не указан'}

Дата создания отчета: ${new Date().toLocaleString('ru-RU')}
`;

    const reportBlob = new Blob([reportText], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(reportBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-${order?.order_number}-logistics.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Успешно",
      description: "Логистический отчет создан",
    });
  };

  const getShipmentStatusLabel = (status: string) => {
    switch (status) {
      case 'not_shipped':
        return 'Не отправлен';
      case 'partially_shipped':
        return 'Частично отправлен';
      case 'in_transit':
        return 'В пути';
      default:
        return 'Не указан';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Экспорт данных заказа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={exportOrderData}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Экспорт данных (JSON)
            </Button>

            <Button
              variant="outline"
              onClick={exportOrderReport}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Создать отчет (TXT)
            </Button>

            <Button
              variant="outline"
              onClick={downloadAllImages}
              disabled={!order?.images || order.images.length === 0}
              className="flex items-center gap-2"
            >
              <Image className="h-4 w-4" />
              Скачать все изображения
            </Button>

            <Button
              variant="outline"
              onClick={exportLogisticsReport}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Логистический отчет (TXT)
            </Button>

            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Печать страницы
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Информация об экспорте</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• <strong>JSON данные:</strong> Полная структурированная информация о заказе</p>
            <p>• <strong>Текстовый отчет:</strong> Читаемый отчет для печати или архивирования</p>
            <p>• <strong>Изображения:</strong> Все медиафайлы заказа в исходном качестве</p>
            <p>• <strong>Печать:</strong> Текущая страница со всей информацией</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
