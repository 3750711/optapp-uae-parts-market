
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
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminOrders = () => {
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
            <AdminOrdersTable orders={orders || []} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
