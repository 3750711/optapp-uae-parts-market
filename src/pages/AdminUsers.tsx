import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, Edit, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { UserRatingDialog } from '@/components/admin/UserRatingDialog';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleVerificationChange = async (userId: string, newStatus: 'verified' | 'pending') => {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: newStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус верификации",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Успех",
        description: "Статус верификации обновлен"
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <p>Загрузка...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users?.map((user) => (
                <Card key={user.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="font-medium text-lg">{user.full_name || 'Без имени'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="font-mono">
                          {user.opt_id || 'Нет OPT ID'}
                        </Badge>
                        <Badge className={`${
                          user.user_type === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : user.user_type === 'seller'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.user_type}
                        </Badge>
                        <Badge className={`${
                          user.verification_status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.verification_status}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        {user.company_name && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Компания:</span>{' '}
                            {user.company_name}
                          </div>
                        )}
                        {user.phone && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Телефон:</span>{' '}
                            {user.phone}
                          </div>
                        )}
                        {user.telegram && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Telegram:</span>{' '}
                            {user.telegram}
                          </div>
                        )}
                        {user.rating !== null && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Рейтинг:</span>{' '}
                            <span className="font-semibold">{user.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        {user.verification_status === 'pending' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVerificationChange(user.id, 'verified')}
                            className="h-8 w-8"
                          >
                            <UserCheck className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleVerificationChange(user.id, 'pending')}
                            className="h-8 w-8"
                          >
                            <UserX className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                        <UserEditDialog
                          user={user}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                          onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
                          }}
                        />
                        <UserRatingDialog
                          user={user}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          }
                          onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
