
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import ProductEditForm from '@/components/product/ProductEditForm';
import { Product } from '@/types/product';

interface ProductEditDialogProps {
  product: Product;
  trigger?: React.ReactNode;
}

const ProductEditDialog: React.FC<ProductEditDialogProps> = ({
  product,
  trigger
}) => {
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      title="Редактировать товар"
    >
      <Edit className="h-3.5 w-3.5" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать товар</DialogTitle>
        </DialogHeader>
        <ProductEditForm
          product={product}
          onCancel={handleCancel}
          onSave={handleSave}
          isCreator={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditDialog;
