import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Edit3, 
  Eye, 
  EyeOff, 
  Archive, 
  RotateCcw, 
  Share2, 
  Copy, 
  Download,
  MessageSquare,
  Phone,
  QrCode,
  MoreHorizontal,
  DollarSign,
  Zap,
  TrendingUp,
  Settings
} from "lucide-react";
import { Product } from "@/types/product";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface SellerQuickActionsProps {
  product: Product;
  onProductUpdate: () => void;
}

const SellerQuickActions: React.FC<SellerQuickActionsProps> = ({
  product,
  onProductUpdate
}) => {
  const navigate = useNavigate();
  const [showPriceEdit, setShowPriceEdit] = useState(false);
  const [newPrice, setNewPrice] = useState(product.price.toString());
  const [showQRCode, setShowQRCode] = useState(false);

  const handleEdit = () => {
    navigate(`/seller/edit-product/${product.id}`);
  };

  const handleQuickPriceUpdate = () => {
    // Логика быстрого обновления цены
    toast({
      title: "Цена обновлена",
      description: `Новая цена: ${parseInt(newPrice).toLocaleString('ru-RU')} ₽`,
    });
    setShowPriceEdit(false);
    onProductUpdate();
  };

  const handleShare = async () => {
    const url = window.location.href.replace('/seller/', '/');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Посмотрите это объявление: ${product.title}`,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Ссылка скопирована",
      description: "Ссылка на объявление скопирована в буфер обмена",
    });
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    toast({
      title: "Экспорт",
      description: `Экспорт в ${format.toUpperCase()} будет доступен скоро`,
    });
  };

  const getStatusActions = () => {
    switch (product.status) {
      case 'active':
        return [
          { icon: EyeOff, label: 'Скрыть', action: () => {}, variant: 'outline' as const },
          { icon: Archive, label: 'В архив', action: () => {}, variant: 'outline' as const },
        ];
      case 'archived':
        return [
          { icon: RotateCcw, label: 'Восстановить', action: () => {}, variant: 'default' as const },
        ];
      case 'sold':
        return [
          { icon: RotateCcw, label: 'Вернуть в продажу', action: () => {}, variant: 'default' as const },
        ];
      default:
        return [];
    }
  };

  const statusActions = getStatusActions();

  return (
    <div className="space-y-6 mb-8">
      {/* Quick Price Update */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Быстрые действия
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Edit Product */}
            <Button variant="default" onClick={handleEdit} className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Редактировать
            </Button>

            {/* Quick Price Edit */}
            <Dialog open={showPriceEdit} onOpenChange={setShowPriceEdit}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Изменить цену
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Быстрое изменение цены</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="price">Новая цена (₽)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Введите новую цену"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowPriceEdit(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleQuickPriceUpdate}>
                      Обновить цену
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Status Actions */}
            {statusActions.map((action, index) => (
              <Button 
                key={index}
                variant={action.variant}
                onClick={action.action}
                className="flex items-center gap-2"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}

            {/* Share */}
            <Button variant="outline" onClick={handleShare} className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Поделиться
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  Ещё
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={() => copyToClipboard(window.location.href)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Копировать ссылку
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowQRCode(true)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  QR код
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт в PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт в Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats and Insights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Быстрая статистика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">{product.view_count || 0}</div>
              <div className="text-sm text-muted-foreground">Просмотров</div>
              <Badge variant="outline" className="mt-1">
                {product.view_count && product.view_count > 50 ? 'Популярно' : 'Новое'}
              </Badge>
            </div>

            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">{product.offers_count || 0}</div>
              <div className="text-sm text-muted-foreground">Предложений</div>
              <Badge variant={product.offers_count && product.offers_count > 0 ? "default" : "secondary"} className="mt-1">
                {product.offers_count && product.offers_count > 0 ? 'Есть интерес' : 'Нет предложений'}
              </Badge>
            </div>

            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">
                {product.max_offer_price ? `${product.max_offer_price.toLocaleString('ru-RU')} ₽` : '—'}
              </div>
              <div className="text-sm text-muted-foreground">Макс. предложение</div>
              {product.max_offer_price && (
                <Badge variant="outline" className="mt-1">
                  {Math.round((product.max_offer_price / product.price) * 100)}% от цены
                </Badge>
              )}
            </div>

            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold">
                {product.created_at ? 
                  Math.floor((new Date().getTime() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24)) 
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">Дней в продаже</div>
              <Badge variant="secondary" className="mt-1">
                {product.status === 'active' ? 'Активно' : 'Неактивно'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Связь с покупателями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Telegram
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Сообщения на сайте
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR код объявления</DialogTitle>
          </DialogHeader>
          <div className="text-center p-6">
            <div className="w-48 h-48 bg-muted mx-auto mb-4 rounded-lg flex items-center justify-center">
              <QrCode className="h-16 w-16 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Покажите этот QR код покупателям для быстрого доступа к объявлению
            </p>
            <Button onClick={() => setShowQRCode(false)}>
              Закрыть
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerQuickActions;