
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import { useConfirmationUpload } from '@/components/admin/useConfirmationUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface OrderConfirmationCardProps {
  orderId: string;
  status: string;
  onStatusChange?: (newStatus: string) => void;
}

const OrderConfirmationCard: React.FC<OrderConfirmationCardProps> = ({
  orderId,
  status,
  onStatusChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { 
    isUploading, 
    confirmImages, 
    uploadConfirmImage, 
    isAdmin 
  } = useConfirmationUpload(orderId);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadConfirmImage(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'completed': return 'default';
      case 'confirmed': return 'secondary';
      case 'created': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'confirmed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Подтверждение заказа</span>
          <Badge variant={getStatusBadgeVariant()} className="flex items-center gap-1">
            {getStatusIcon()}
            {status === 'completed' ? 'Завершен' : status === 'confirmed' ? 'Подтвержден' : 'Ожидает'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && (
          <div className="space-y-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Загрузка...' : 'Загрузить подтверждение'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {confirmImages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Подтверждающие изображения:</h4>
            <div className="grid grid-cols-2 gap-2">
              {confirmImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Подтверждение ${index + 1}`}
                    className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                    onClick={() => setSelectedImage(imageUrl)}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedImage(imageUrl)}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image preview dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Подтверждающее изображение</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Подтверждение заказа"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default OrderConfirmationCard;
