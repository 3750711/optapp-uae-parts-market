
import React, { useState } from "react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductDeleteDialogProps {
  productId: string;
  productName: string;
  onDeleted: () => void;
}

const ProductDeleteDialog: React.FC<ProductDeleteDialogProps> = ({ productId, productName, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    setLoading(false);

    if (error) {
      toast({
        title: "Ошибка удаления",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Объявление удалено",
        description: `«${productName}» успешно удалено`,
        variant: "default"
      });
      onDeleted();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" className="ml-2" aria-label="Удалить объявление">
          <span className="sr-only">Удалить</span>
          <Trash className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "Удаление..." : "Удалить"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ProductDeleteDialog;
