import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, Edit, Star, ExternalLink, Ban, UserCog, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { UserRatingDialog } from '@/components/admin/UserRatingDialog';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileType } from '@/components/profile/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Sorting types
type SortField = 'full_name' | 'email' | 'user_type' | 'verification_status' | 'opt_status' | 'created_at' | 'rating' | 'opt_id';
type SortDirection = 'asc' | 'desc';

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: pendingUsersCount } = useQuery({
    queryKey: ['admin', 'users', 'pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');
      
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', statusFilter, sortField, sortDirection, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,opt_id.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ProfileType[];
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

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

  const handleQuickStatusChange = async (userId: string, newStatus: 'verified' | 'pending' | 'blocked') => {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: newStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус пользователя",
        variant: "destructive"
      });
    } else {
      const { data: userData } = await supabase
        .from('profiles')
        .select('telegram')
        .eq('id', userId)
        .single();

      if (userData?.telegram) {
        try {
          await supabase.functions.invoke('send-telegram-notification', {
            body: JSON.stringify({
              userId,
              status: newStatus,
              telegram: userData.telegram
            })
          });
        } catch (notificationError) {
          console.error('Failed to send Telegram notification:', notificationError);
        }
      }

      toast({
        title: "Успех",
        description: "Статус пользователя обновлен"
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  };

  const handleOptStatusChange = async (userId: string, newStatus: 'free_user' | 'opt_user') => {
    const { error } = await supabase
      .from('profiles')
      .update({ opt_status: newStatus })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить OPT статус пользователя",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Успех",
        description: "OPT статус пользователя обновлен"
      });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  };

  // Render sort direction indicator
  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? 
        <ChevronUp size={16} /> : 
        <ChevronDown size={16} />;
    }
    return null;
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
        <Card className={pendingUsersCount && pendingUsersCount > 0 ? 'bg-[#FEC6A1]' : ''}>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>Пользователи</CardTitle>
              {pendingUsersCount && pendingUsersCount > 0 && (
                <Badge variant="secondary">{pendingUsersCount} ожидает</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Input 
                placeholder="Поиск пользователей..." 
                className="w-[250px]" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'pending' | 'verified') => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидает подтверждения</SelectItem>
                  <SelectItem value="verified">Подтвержден</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('full_name')}
                    >
                      <div className="flex items-center">
                        Имя пользователя {renderSortIcon('full_name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        Email {renderSortIcon('email')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('opt_id')}
                    >
                      <div className="flex items-center">
                        OPT_ID {renderSortIcon('opt_id')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('user_type')}
                    >
                      <div className="flex items-center">
                        Тип {renderSortIcon('user_type')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('verification_status')}
                    >
                      <div className="flex items-center">
                        Статус {renderSortIcon('verification_status')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('opt_status')}
                    >
                      <div className="flex items-center">
                        OPT Статус {renderSortIcon('opt_status')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('rating')}
                    >
                      <div className="flex items-center">
                        Рейтинг {renderSortIcon('rating')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Дата регистрации {renderSortIcon('created_at')}
                      </div>
                    </TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow 
                      key={user.id}
                      className={`${
                        user.verification_status === 'pending'
                          ? 'bg-orange-50'
                          : user.verification_status === 'verified'
                          ? 'bg-green-50'
                          : user.verification_status === 'blocked'
                          ? 'bg-red-50'
                          : ''
                      }`}
                    >
                      <TableCell>{user.full_name || 'Без имени'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.opt_id || 'Не указан'}</TableCell>
                      <TableCell>
                        <Badge className={`${
                          user.user_type === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : user.user_type === 'seller'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.user_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${
                          user.verification_status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : user.verification_status === 'blocked'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.opt_status && (
                          <Badge className={`${
                            user.opt_status === 'opt_user'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.opt_status === 'opt_user' ? 'OPT' : 'Free User'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.rating !== null ? user.rating.toFixed(1) : 'N/A'}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/seller/${user.id}`)}
                            className="h-8 w-8"
                            title="Открыть публичный профиль"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>

                          {user.verification_status !== 'verified' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuickStatusChange(user.id, 'verified')}
                              className="h-8 w-8"
                              title="Подтвердить пользователя"
                            >
                              <UserCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}

                          {user.verification_status !== 'blocked' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuickStatusChange(user.id, 'blocked')}
                              className="h-8 w-8"
                              title="Заблокировать пользователя"
                            >
                              <Ban className="h-4 w-4 text-red-600" />
                            </Button>
                          )}

                          {user.verification_status !== 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleQuickStatusChange(user.id, 'pending')}
                              className="h-8 w-8"
                              title="Сбросить статус на 'Ожидает'"
                            >
                              <UserX className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Изменить OPT статус"
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => handleOptStatusChange(user.id, 'free_user')}
                                className={user.opt_status === 'free_user' ? 'bg-accent' : ''}
                              >
                                Свободный пользователь
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOptStatusChange(user.id, 'opt_user')}
                                className={user.opt_status === 'opt_user' ? 'bg-accent' : ''}
                              >
                                OPT пользователь
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

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
              
              <div className="text-center text-sm text-gray-500 mt-4">
                Показано {users?.length || 0} пользователей
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
