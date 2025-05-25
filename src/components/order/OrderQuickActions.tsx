
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Copy, 
  Download, 
  Share2, 
  Phone, 
  MessageCircle, 
  ExternalLink,
  FileText,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface OrderQuickActionsProps {
  order: any;
  onRefresh?: () => void;
}

export const OrderQuickActions: React.FC<OrderQuickActionsProps> = ({
  order,
  onRefresh
}) => {
  const isMobile = useIsMobile();

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.order_number?.toString() || '');
      toast({
        title: "Номер скопирован",
        description: `Номер заказа ${order.order_number} скопирован в буфер обмена`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать номер заказа",
        variant: "destructive",
      });
    }
  };

  const handleCopyOrderInfo = async () => {
    const orderInfo = `
Заказ №${order.order_number}
Товар: ${order.title}
Бренд: ${order.brand || 'Не указан'}
Модель: ${order.model || 'Не указана'}
Цена: $${order.price || 0}
Статус: ${order.status}
    `.trim();

    try {
      await navigator.clipboard.writeText(orderInfo);
      toast({
        title: "Информация скопирована",
        description: "Данные заказа скопированы в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать информацию",
        variant: "destructive",
      });
    }
  };

  const handleShareOrder = async () => {
    const shareData = {
      title: `Заказ №${order.order_number}`,
      text: `${order.title} - ${order.brand} ${order.model}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await handleCopyOrderInfo();
    }
  };

  const handleContactTelegram = () => {
    if (order.telegram_url_order) {
      const telegramUrl = `https://t.me/${order.telegram_url_order.replace('@', '')}`;
      window.open(telegramUrl, '_blank');
    } else {
      toast({
        title: "Контакт недоступен",
        description: "Telegram пользователя не указан",
        variant: "destructive",
      });
    }
  };

  const handleExportOrder = () => {
    const orderData = {
      order_number: order.order_number,
      title: order.title,
      brand: order.brand,
      model: order.model,
      price: order.price,
      status: order.status,
      created_at: order.created_at,
      seller_name: order.order_seller_name,
      buyer_opt_id: order.buyer_opt_id,
    };

    const dataStr = JSON.stringify(orderData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `order-${order.order_number}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Экспорт завершен",
      description: "Данные заказа сохранены в файл",
    });
  };

  const actions = [
    {
      icon: Copy,
      label: "Копировать №",
      action: handleCopyOrderNumber,
      variant: "outline" as const,
    },
    {
      icon: FileText,
      label: "Копировать инфо",
      action: handleCopyOrderInfo,
      variant: "outline" as const,
    },
    {
      icon: Share2,
      label: "Поделиться",
      action: handleShareOrder,
      variant: "outline" as const,
    },
    {
      icon: Download,
      label: "Экспорт",
      action: handleExportOrder,
      variant: "outline" as const,
    },
  ];

  if (order.telegram_url_order) {
    actions.push({
      icon: MessageCircle,
      label: "Telegram",
      action: handleContactTelegram,
      variant: "default" as const,
    });
  }

  if (onRefresh) {
    actions.push({
      icon: RefreshCw,
      label: "Обновить",
      action: onRefresh,
      variant: "outline" as const,
    });
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className={`
          flex gap-2 
          ${isMobile ? 'flex-wrap' : 'flex-wrap md:flex-nowrap'}
        `}>
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              size={isMobile ? "sm" : "default"}
              onClick={action.action}
              className={isMobile ? "flex-1 min-w-[100px]" : ""}
            >
              <action.icon className="h-4 w-4 mr-1" />
              {isMobile ? action.label.split(' ')[0] : action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
