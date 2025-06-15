
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from 'react-router-dom';
import { ProfileType } from '@/components/profile/types';
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileUserCard } from '@/components/admin/MobileUserCard';
import { BulkUserActions } from '@/components/admin/BulkUserActions';
import { EnhancedUserFilters } from '@/components/admin/EnhancedUserFilters';
import { UsersPagination } from '@/components/admin/UsersPagination';
import { UsersTableSkeleton } from '@/components/admin/UsersTableSkeleton';
import { AdminUsersHeader } from '@/components/admin/AdminUsersHeader';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminUsersDialogs } from '@/components/admin/AdminUsersDialogs';
import { VirtualizedUsersTable } from '@/components/admin/VirtualizedUsersTable';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { useAdminUsersState } from '@/hooks/useAdminUsersState';
import { useAdminUsersActions } from '@/hooks/useAdminUsersActions';
import { useOptimizedAdminUsers } from '@/hooks/useOptimizedAdminUsers';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  
  // Custom hooks for state and actions
  const {
    filters,
    debouncedSearch,
    sortField,
    sortDirection,
    currentPage,
    pageSize,
    isCompactMode,
    selectedUsers,
    activeFiltersCount,
    handleFilterChange,
    handleClearFilters,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    setIsCompactMode,
    handleSelectUser,
    handleSelectAll,
    handleClearSelection
  } = useAdminUsersState();

  const {
    handleQuickStatusChange,
    handleOptStatusChange,
    handleBulkAction,
    handleExportUsers,
    handleContextAction
  } = useAdminUsersActions();

  // Используем новый оптимизированный хук
  const { data: usersData, isLoading } = useOptimizedAdminUsers({
    search: debouncedSearch,
    status: filters.status,
    userType: filters.userType,
    optStatus: filters.optStatus,
    ratingFrom: filters.ratingFrom,
    ratingTo: filters.ratingTo,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sortField,
    sortDirection,
    currentPage,
    pageSize
  });

  // Оптимизированный запрос для подсчета ожидающих пользователей
  const { data: pendingUsersCount } = useOptimizedAdminUsers({
    search: '',
    status: 'pending',
    userType: 'all',
    optStatus: 'all',
    ratingFrom: '',
    ratingTo: '',
    dateFrom: undefined,
    dateTo: undefined,
    sortField: 'created_at',
    sortDirection: 'desc',
    currentPage: 1,
    pageSize: 1
  });
  
  // Dialog states
  const [editingUser, setEditingUser] = useState<ProfileType | null>(null);

  // Определяем нужно ли использовать виртуализацию (для списков больше 50 элементов)
  const useVirtualization = useMemo(() => {
    return !isMobile && (usersData?.users.length || 0) > 50;
  }, [isMobile, usersData?.users.length]);

  // Вычисляем высоту контейнера для виртуализации
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100; // Оставляем место для пагинации
        setContainerHeight(Math.max(400, availableHeight));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const users = usersData?.users || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = usersData?.totalPages || 1;

  // Handle editing user
  const handleEditUser = (user: ProfileType) => {
    setEditingUser(user);
  };

  const handleEditDialogClose = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users-optimized'] });
    setEditingUser(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            if (users.length > 0) {
              handleSelectAll(users.map(user => user.id));
            }
            break;
          case 'e':
            e.preventDefault();
            if (users.length > 0) {
              handleExportUsers(users);
            }
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
  }, [users, handleSelectAll, handleExportUsers]);

  const wrappedHandleBulkAction = useCallback((action: string) => {
    handleBulkAction(action, selectedUsers).then(() => {
      handleClearSelection();
    });
  }, [handleBulkAction, selectedUsers, handleClearSelection]);

  const wrappedHandleExportUsers = useCallback(() => {
    handleExportUsers(users);
  }, [handleExportUsers, users]);

  const wrappedHandleSelectAll = useCallback(() => {
    handleSelectAll(users.map(user => user.id));
  }, [handleSelectAll, users]);

  return (
    <AdminErrorBoundary>
      <AdminLayout>
        <div className="container mx-auto py-8">
          <Card className={pendingUsersCount?.totalCount && pendingUsersCount.totalCount > 0 ? 'bg-[#FEC6A1]' : ''}>
            <AdminUsersHeader
              pendingUsersCount={pendingUsersCount?.totalCount}
              isCompactMode={isCompactMode}
              onCompactModeChange={setIsCompactMode}
            />
            
            <CardContent className="space-y-4">
              <AdminErrorBoundary
                fallback={
                  <div className="p-4 text-center text-red-600">
                    Ошибка загрузки фильтров. Попробуйте обновить страницу.
                  </div>
                }
              >
                <EnhancedUserFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  activeFiltersCount={activeFiltersCount}
                />
              </AdminErrorBoundary>

              <AdminErrorBoundary
                fallback={
                  <div className="p-4 text-center text-red-600">
                    Ошибка загрузки действий. Попробуйте обновить страницу.
                  </div>
                }
              >
                <BulkUserActions
                  selectedUsers={selectedUsers}
                  totalUsers={users.length}
                  onSelectAll={wrappedHandleSelectAll}
                  onClearSelection={handleClearSelection}
                  onBulkAction={wrappedHandleBulkAction}
                  onExport={wrappedHandleExportUsers}
                />
              </AdminErrorBoundary>
              
              <div ref={containerRef}>
                {isLoading ? (
                  <UsersTableSkeleton rows={pageSize} isCompact={isCompactMode} />
                ) : isMobile ? (
                  <AdminErrorBoundary
                    fallback={
                      <div className="p-4 text-center text-red-600">
                        Ошибка отображения пользователей. Попробуйте обновить страницу.
                      </div>
                    }
                  >
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
                          onRating={() => {}}
                          onOptStatusChange={handleOptStatusChange}
                        />
                      ))}
                    </div>
                  </AdminErrorBoundary>
                ) : useVirtualization ? (
                  <AdminErrorBoundary
                    fallback={
                      <div className="p-4 text-center text-red-600">
                        Ошибка виртуализации. Показываем обычную таблицу.
                      </div>
                    }
                  >
                    <VirtualizedUsersTable
                      users={users}
                      height={containerHeight}
                      isCompactMode={isCompactMode}
                      selectedUsers={selectedUsers}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      onSelectUser={handleSelectUser}
                      onQuickStatusChange={handleQuickStatusChange}
                      onOptStatusChange={handleOptStatusChange}
                      onEditUser={handleEditUser}
                      onOpenProfile={(userId) => navigate(`/seller/${userId}`)}
                      onContextAction={handleContextAction}
                    />
                    
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-green-600 mt-2">
                        ⚡ Виртуализация активна для {users.length} пользователей
                      </div>
                    )}
                  </AdminErrorBoundary>
                ) : (
                  <AdminErrorBoundary
                    fallback={
                      <div className="p-4 text-center text-red-600">
                        Ошибка таблицы пользователей. Попробуйте обновить страницу.
                      </div>
                    }
                  >
                    <AdminUsersTable
                      users={users}
                      isCompactMode={isCompactMode}
                      selectedUsers={selectedUsers}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      onSelectUser={handleSelectUser}
                      onQuickStatusChange={handleQuickStatusChange}
                      onOptStatusChange={handleOptStatusChange}
                      onEditUser={handleEditUser}
                      onOpenProfile={(userId) => navigate(`/seller/${userId}`)}
                      onContextAction={handleContextAction}
                    />
                  </AdminErrorBoundary>
                )}
              </div>
              
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

          <AdminUsersDialogs
            editingUser={editingUser}
            ratingUser={null}
            onEditDialogClose={handleEditDialogClose}
            onRatingDialogClose={() => {}}
          />
        </div>
      </AdminLayout>
    </AdminErrorBoundary>
  );
};

export default AdminUsers;
