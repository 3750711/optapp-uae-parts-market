
import React from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminOrderCard } from "@/components/admin/AdminOrderCard";
import { Loader2 } from "lucide-react";
import { AdminOrderEditDialog } from '@/components/admin/AdminOrderEditDialog';
import { AdminOrderDeleteDialog } from '@/components/admin/AdminOrderDeleteDialog';
import { toast } from "@/hooks/use-toast";

const AdminOrders = () => {
  const [selectedOrder, setSelectedOrder] = React.useState<any>(null);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey (
            telegram,
            full_name,
            opt_id,
            email,
            phone
          ),
          seller:profiles!orders_seller_id_fkey (
            telegram,
            full_name,
            opt_id,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить заказы",
          variant: "destructive",
        });
        throw error;
      }

      return data;
    }
  });

  const handleEdit = (order: any) => {
    setSelectedOrder(order);
    setShowEditDialog(true);
  };

  const handleDelete = (order: any) => {
    setSelectedOrder(order);
    setShowDeleteDialog(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Управление заказами</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders?.map((order) => (
                <AdminOrderCard
                  key={order.id}
                  order={order}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <AdminOrderEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          order={selectedOrder}
        />

        <AdminOrderDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          order={selectedOrder}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
