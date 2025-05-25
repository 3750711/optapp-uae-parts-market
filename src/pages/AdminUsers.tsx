import React, { useState, useEffect, useMemo } from 'react';
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
import { UserCheck, UserX, Edit, Star, ExternalLink, Ban, UserCog, ChevronDown, ChevronUp, Keyboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserEditDialog } from '@/components/admin/UserEditDialog';
import { UserRatingDialog } from '@/components/admin/UserRatingDialog';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { UserContextMenu } from '@/components/admin/UserContextMenu';
import { MobileUserCard } from '@/components/admin/MobileUserCard';
import { BulkUserActions } from '@/components/admin/BulkUserActions';
import { EnhancedUserFilters } from '@/components/admin/EnhancedUserFilters';
import { useIsMobile } from "@/hooks/use-mobile";
import * as XLSX from 'xlsx';

// Sorting types
type SortField = 'full_name' | 'email' | 'user_type' | 'verification_status' | 'opt_status' | 'created_at' | 'rating' | 'opt_id';
type SortDirection = 'asc' | 'desc';

// Filter state type
interface FilterState {
  search: string;
  status: string;
  userType: string;
  optStatus: string;
  ratingFrom: string;
  ratingTo: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    userType: 'all',
    optStatus: 'all',
    ratingFrom: '',
    ratingTo: '',
    dateFrom: undefined,
    dateTo: undefined
  });

  const debouncedSearch = useDebounceSearch(filters.search, 300);
  
  // Sorting and pagination
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // UI settings
  const [isCompactMode, setIsCompactMode] = useState(false);
  
  // Bulk actions
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Dialog states
  const [editingUser, setEditingUser] = useState<ProfileType | null>(null);
  const [ratingUser, setRatingUser] = useState<ProfileType | null>(null);

  // Handle editing user - add logging
  const handleEditUser = (user: ProfileType) => {
    console.log("Setting editing user:", user);
    setEditingUser(user);
  };

  const handleEditDialogClose = () => {
    console.log("Closing edit dialog, invalidating cache");
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    setEditingUser(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            handleSelectAll();
            break;
          case 'e':
            e.preventDefault();
            handleExportUsers();
            break;
          case 'f':
            e.preventDefault();
            document.getElementById('user-search')?.focus();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedUsers.length]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.userType !== 'all') count++;
    if (filters.optStatus !== 'all') count++;
    if (filters.ratingFrom) count++;
    if (filters.ratingTo) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      userType: 'all',
      optStatus: 'all',
      ratingFrom: '',
      ratingTo: '',
      dateFrom: undefined,
      dateTo: undefined
    });
    setCurrentPage(1);
  };

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
    queryKey: ['admin', 'users', filters, sortField, sortDirection, debouncedSearch, currentPage, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('verification_status', filters.status);
      }
      
      if (filters.userType !== 'all') {
        query = query.eq('user_type', filters.userType);
      }
      
      if (filters.optStatus !== 'all') {
        query = query.eq('opt_status', filters.optStatus);
      }

      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,company_name.ilike.%${debouncedSearch}%,opt_id.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%,telegram.ilike.%${debouncedSearch}%`);
      }

      // Rating filters
      if (filters.ratingFrom) {
        query = query.gte('rating', parseFloat(filters.ratingFrom));
      }
      if (filters.ratingTo) {
        query = query.lte('rating', parseFloat(filters.ratingTo));
      }

      // Date filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        query = query.lte('created_at', dateTo.toISOString());
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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

  // Bulk operations
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(users.map(user => user.id));
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    const statusMap: Record<string, 'verified' | 'pending' | 'blocked'> = {
      verify: 'verified',
      block: 'blocked',
      pending: 'pending'
    };

    const newStatus = statusMap[action];
    if (!newStatus) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: newStatus })
        .in('id', selectedUsers);

      if (error) throw error;

      toast({
        title: "Успех",
        description: `Статус ${selectedUsers.length} пользователей обновлен`
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setSelectedUsers([]);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус пользователей",
        variant: "destructive"
      });
    }
  };

  const handleExportUsers = () => {
    const exportData = users.map(user => ({
      'Имя': user.full_name || '',
      'Email': user.email,
      'Телефон': user.phone || '',
      'Телеграм': user.telegram || '',
      'Компания': user.company_name || '',
      'OPT ID': user.opt_id || '',
      'Тип пользователя': user.user_type,
      'Статус верификации': user.verification_status,
      'OPT статус': user.opt_status,
      'Рейтинг': user.rating || '',
      'Местоположение': user.location || '',
      'Дата регистрации': new Date(user.created_at).toLocaleDateString('ru-RU')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Пользователи');
    XLSX.writeFile(wb, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Успех",
      description: "Данные пользователей экспортированы"
    });
  };

  const handleContextAction = (userId: string, action: string) => {
    const statusMap: Record<string, 'verified' | 'pending' | 'blocked'> = {
      verify: 'verified',
      block: 'blocked',
      pending: 'pending'
    };

    const newStatus = statusMap[action];
    if (newStatus) {
      handleQuickStatusChange(userId, newStatus);
    }
  };

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
            
            <div className="flex flex-wrap items-center gap-2">
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
              
              <Button variant="outline" size="sm" onClick={() => toast({
                title: "Горячие клавиши",
                description: "Ctrl+A - выбрать все, Ctrl+E - экспорт, Ctrl+F - поиск"
              })}>
                <Keyboard className="h-4 w-4 mr-1" />
                Подсказки
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <EnhancedUserFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              activeFiltersCount={activeFiltersCount}
            />

            <BulkUserActions
              selectedUsers={selectedUsers}
              totalUsers={users.length}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkAction={handleBulkAction}
              onExport={handleExportUsers}
            />
            
            {isLoading ? (
              <UsersTableSkeleton rows={pageSize} isCompact={isCompactMode} />
            ) : isMobile ? (
              <div className="space-y-3">
                {users.map((user) => (
                  <MobileUserCard
                    key={user.id}
                    user={user}
                    isSelected={selectedUsers.includes(user.id)}
                    onSelect={handleSelectUser}
                    onQuickAction={handleContextAction}
                    onOpenProfile={(userId) => navigate(`/seller/${userId}`)}
                    onEdit={handleEditUser}
                    onRating={setRatingUser}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isCompactMode ? 'py-2' : ''}>
                        <div className="flex items-center">
                          Пользователь
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
                      <UserContextMenu
                        key={user.id}
                        user={user}
                        onQuickAction={handleContextAction}
                        onOpenProfile={(userId) => navigate(`/seller/${userId}`)}
                        onEdit={handleEditUser}
                        onRating={setRatingUser}
                      >
                        <TableRow 
                          className={`${
                            user.verification_status === 'pending'
                              ? 'bg-orange-50/50'
                              : user.verification_status === 'verified'
                              ? 'bg-green-50/50'
                              : user.verification_status === 'blocked'
                              ? 'bg-red-50/50'
                              : ''
                          } hover:bg-muted/50 transition-colors cursor-pointer`}
                        >
                          <TableCell className={isCompactMode ? 'py-2' : ''}>
                            <div className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => handleSelectUser(user.id)}
                                className="rounded"
                              />
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

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`${isCompactMode ? 'h-7 w-7' : 'h-8 w-8'} hover:bg-gray-100`}
                                    title="Больше действий"
                                  >
                                    <UserCog className={`${isCompactMode ? 'h-3 w-3' : 'h-4 w-4'}`} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Редактировать
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setRatingUser(user)}>
                                    <Star className="mr-2 h-4 w-4" />
                                    Изменить рейтинг
                                  </DropdownMenuItem>
                                  {user.verification_status !== 'blocked' && (
                                    <DropdownMenuItem
                                      onClick={() => handleQuickStatusChange(user.id, 'blocked')}
                                    >
                                      <Ban className="mr-2 h-4 w-4 text-red-600" />
                                      Заблокировать
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleOptStatusChange(
                                      user.id, 
                                      user.opt_status === 'opt_user' ? 'free_user' : 'opt_user'
                                    )}
                                  >
                                    Переключить OPT статус
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      </UserContextMenu>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
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
                {debouncedSearch || filters.status !== 'all' || filters.userType !== 'all' || filters.optStatus !== 'all' || activeFiltersCount > 0
                  ? 'Пользователи не найдены по заданным критериям' 
                  : 'Пользователи не найдены'
                }
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        {editingUser && (
          <UserEditDialog
            user={editingUser}
            trigger={<div />}
            onSuccess={handleEditDialogClose}
          />
        )}
        
        {ratingUser && (
          <UserRatingDialog
            user={ratingUser}
            trigger={<div />}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
              setRatingUser(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
