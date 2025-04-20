import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, Edit, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { UserRatingDialog } from '@/components/admin/UserRatingDialog';
import { useQueryClient } from '@tanstack/react-query';

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
    return <AdminLayout>
      <div className="flex items-center justify-center h-screen">
        <p>Загрузка...</p>
      </div>
    </AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Пользователи</h1>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Компания</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead>OPT ID</TableHead>
                <TableHead>Рейтинг</TableHead>
                <TableHead>Верификация</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell>{user.company_name || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      user.user_type === 'admin' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.user_type === 'seller'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.user_type}
                    </span>
                  </TableCell>
                  <TableCell>{user.phone || '-'}</TableCell>
                  <TableCell>{user.telegram || '-'}</TableCell>
                  <TableCell>{user.opt_id || '-'}</TableCell>
                  <TableCell>
                    {user.rating !== null ? (
                      <span className="font-semibold">{user.rating.toFixed(1)}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      user.verification_status === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.verification_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
