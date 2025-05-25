
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
import { UserCheck, UserX, Edit, Star, ExternalLink, Ban, UserCog, ChevronDown, ChevronUp, LayoutGrid, List } from "lucide-react";
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
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { UserAvatar } from '@/components/admin/UserAvatar';
import { EnhancedStatusBadge } from '@/components/admin/EnhancedStatusBadge';
import { UsersPagination } from '@/components/admin/UsersPagination';
import { UsersTableSkeleton } from '@/components/admin/UsersTableSkeleton';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Sorting types
type SortField = 'full_name' | 'email' | 'user_type' | 'verification_status' | 'opt_status' | 'created_at' | 'rating' | 'opt_id';
type SortDirection = 'asc' | 'desc';

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Search and filters
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounceSearch(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'blocked'>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'admin' | 'seller' | 'buyer'>('all');
  const [optStatusFilter, setOptStatusFilter] = useState<'all' | 'opt_user' | 'free_user'>('all');
  
  // Sorting and pagination
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // UI settings
  const [isCompactMode, setIsCompactMode] = useState(false);

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

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', statusFilter, userTypeFilter, optStatusFilter, sortField, sortDirection, debouncedSearch, currentPage, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }
      
      if (userTypeFilter !== 'all') {
        query = query.eq('user_type', userTypeFilter);
      }
      
      if (optStatusFilter !== 'all') {
        query = query.eq('opt_status', optStatusFilter);
      }

      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,company_name.ilike.%${debouncedSearch}%,opt_id.ilike.%${debouncedSearch}%`);
      }
      
      // Apply sorting and pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error } = await query
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range(from, to);
      
      if (error) throw error;
      return { 
        users: data as ProfileType[], 
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const users = usersData?.users || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = usersData?.totalPages || 1;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
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

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card className={pendingUsersCount && pendingUsersCount > 0 ? 'bg-[#FEC6A1]' : ''}>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <CardTitle>Пользователи</CardTitle>
              {pendingUsersCount && pendingUsersCount > 0 && (
                <Badge variant="secondary">{pendingUsersCount} ожидает</Badge>
              )}
            </div>
            
            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Compact mode toggle */}
              <div className="flex items-center space-x-2">
                <Switch 
                  id="compact-mode" 
                  checked={isCompactMode}
                  onCheckedChange={setIsCompactMode}
                />
                <Label htmlFor="compact-mode" className="text-sm whitespace-nowrap">
                  Компактный вид
                </Label>
              </div>
              
              {/* Search */}
              <Input 
                placeholder="Поиск пользователей..." 
                className="w-[250px]" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              
              {/* Filters */}
              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'pending' | 'verified' | 'blocked') => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">Ожидает</SelectItem>
                  <SelectItem value="verified">Подтвержден</SelectItem>
                  <SelectItem value="blocked">Заблокирован</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={userTypeFilter}
                onValueChange={(value: 'all' | 'admin' | 'seller' | 'buyer') => {
                  setUserTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="admin">Админ</SelectItem>
                  <SelectItem value="seller">Продавец</SelectItem>
                  <SelectItem value="buyer">Покупатель</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={optStatusFilter}
                onValueChange={(value: 'all' | 'opt_user' | 'free_user') => {
                  setOptStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="OPT статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все OPT</SelectItem>
                  <SelectItem value="opt_user">OPT</SelectItem>
                  <SelectItem value="free_user">Бесплатный</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              {isLoading ? (
                <UsersTableSkeleton rows={pageSize} isCompact={isCompactMode} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
                        onClick={() => handleSort('full_name')}
                      >
                        <div className="flex items-center">
                          Пользователь {renderSortIcon('full_name')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                          Email {renderSortIcon('email')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
                        onClick={() => handleSort('opt_id')}
                      >
                        <div className="flex items-center">
                          OPT_ID {renderSortIcon('opt_id')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
                        onClick={() => handleSort('user_type')}
                      >
                        <div className="flex items-center">
                          Тип {renderSortIcon('user_type')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
                        onClick={() => handleSort('verification_status')}
                      >
                        <div className="flex items-center">
                          Статус {renderSortIcon('verification_status')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
                        onClick={() => handleSort('opt_status')}
                      >
                        <div className="flex items-center">
                          OPT Статус {renderSortIcon('opt_status')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
                        onClick={() => handleSort('rating')}
                      >
                        <div className="flex items-center">
                          Рейтинг {renderSortIcon('rating')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center">
                          Дата регистрации {renderSortIcon('created_at')}
                        </div>
                      </TableHead>
                      <TableHead className={isCompactMode ? 'py-2' : ''}>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow 
                        key={user.id}
                        className={`${
                          user.verification_status === 'pending'
                            ? 'bg-orange-50/50'
                            : user.verification_status === 'verified'
                            ? 'bg-green-50/50'
                            : user.verification_status === 'blocked'
                            ? 'bg-red-50/50'
                            : ''
                        } hover:bg-muted/50 transition-colors`}
                      >
                        <TableCell className={isCompactMode ? 'py-2' : ''}>
                          <div className="flex items-center gap-3">
                            <UserAvatar 
                              user={user} 
                              size={isCompactMode ? 'sm' : 'md'} 
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-sm">
                                {user.full_name || 'Без имени'}
                              </div>
                              {user.company_name && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {user.company_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={`${isCompactMode ? 'py-2' : ''} font-mono text-sm`}>
                          {user.email}
                        </TableCell>
                        <TableCell className={`${isCompactMode ? 'py-2' : ''} font-mono text-sm`}>
                          {user.opt_id || <span className="text-muted-foreground">Не указан</span>}
                        </TableCell>
                        <TableCell className={isCompactMode ? 'py-2' : ''}>
                          <EnhancedStatusBadge 
                            type="userType" 
                            value={user.user_type} 
                            size={isCompactMode ? 'sm' : 'md'}
                          />
                        </TableCell>
                        <TableCell className={isCompactMode ? 'py-2' : ''}>
                          <EnhancedStatusBadge 
                            type="verification" 
                            value={user.verification_status} 
                            size={isCompactMode ? 'sm' : 'md'}
                          />
                        </TableCell>
                        <TableCell className={isCompactMode ? 'py-2' : ''}>
                          {user.opt_status && (
                            <EnhancedStatusBadge 
                              type="optStatus" 
                              value={user.opt_status} 
                              size={isCompactMode ? 'sm' : 'md'}
                            />
                          )}
                        </TableCell>
                        <TableCell className={isCompactMode ? 'py-2' : ''}>
                          <div className="flex items-center gap-1">
                            {user.rating !== null ? (
                              <>
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="font-medium">{user.rating.toFixed(1)}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className={`${isCompactMode ? 'py-2' : ''} text-sm text-muted-foreground`}>
                          {new Date(user.created_at).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell className={isCompactMode ? 'py-2' : ''}>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/seller/${user.id}`)}
                              className={`${isCompactMode ? 'h-7 w-7' : 'h-8 w-8'} hover:bg-blue-100`}
                              title="Открыть публичный профиль"
                            >
                              <ExternalLink className={`${isCompactMode ? 'h-3 w-3' : 'h-4 w-4'} text-blue-600`} />
                            </Button>

                            {user.verification_status !== 'verified' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuickStatusChange(user.id, 'verified')}
                                className={`${isCompactMode ? 'h-7 w-7' : 'h-8 w-8'} hover:bg-green-100`}
                                title="Подтвердить пользователя"
                              >
                                <UserCheck className={`${isCompactMode ? 'h-3 w-3' : 'h-4 w-4'} text-green-600`} />
                              </Button>
                            )}

                            {user.verification_status !== 'blocked' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuickStatusChange(user.id, 'blocked')}
                                className={`${isCompactMode ? 'h-7 w-7' : 'h-8 w-8'} hover:bg-red-100`}
                                title="Заблокировать пользователя"
                              >
                                <Ban className={`${isCompactMode ? 'h-3 w-3' : 'h-4 w-4'} text-red-600`} />
                              </Button>
                            )}

                            {user.verification_status !== 'pending' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuickStatusChange(user.id, 'pending')}
                                className={`${isCompactMode ? 'h-7 w-7' : 'h-8 w-8'} hover:bg-orange-100`}
                                title="Сбросить статус на 'Ожидает'"
                              >
                                <UserX className={`${isCompactMode ? 'h-3 w-3' : 'h-4 w-4'} text-orange-600`} />
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`${isCompactMode ? 'h-7 w-7' : 'h-8 w-8'} hover:bg-gray-100`}
                                  title="Изменить OPT статус"
                                >
                                  <UserCog className={`${isCompactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
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
                                  className={`${isCompactMode ? 'h-7 w-7' : 'h-8 w-8'} hover:bg-gray-100`}
                                >
                                  <Edit className={`${isCompactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
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
                                  className={`${isCompactMode ? 'h-7 w-7' : 'h-8 w-8'} hover:bg-amber-100`}
                                >
                                  <Star className={`${isCompactMode ? 'h-3 w-3' : 'h-4 w-4'} text-amber-600`} />
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
              )}
            </div>
            
            {/* Pagination */}
            {!isLoading && users.length > 0 && (
              <UsersPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalCount}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
            
            {!isLoading && users.length === 0 && (
              <div className="text-center text-sm text-gray-500 mt-8">
                {debouncedSearch || statusFilter !== 'all' || userTypeFilter !== 'all' || optStatusFilter !== 'all' 
                  ? 'Пользователи не найдены по заданным критериям' 
                  : 'Пользователи не найдены'
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
