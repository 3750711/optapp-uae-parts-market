import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from "@/components/ui/card";
import { ProfileType } from '@/components/profile/types';
import { useIsMobile } from "@/hooks/use-mobile";
import { BulkUserActions } from '@/components/admin/BulkUserActions';
import { EnhancedUserFilters } from '@/components/admin/EnhancedUserFilters';
import { UsersPagination } from '@/components/admin/UsersPagination';
import { AdminUsersHeader } from '@/components/admin/AdminUsersHeader';
import { AdminUsersDialogs } from '@/components/admin/AdminUsersDialogs';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { SafeComponentLoader } from '@/components/admin/SafeComponentLoader';
import { useAdminUsersState } from '@/hooks/useAdminUsersState';
import { useAdminUsersActions } from '@/hooks/useAdminUsersActions';
import { useOptimizedAdminUsers } from '@/hooks/useOptimizedAdminUsers';
import { AdminUsersContent } from '@/components/admin/AdminUsersContent';
import { useAdminPWALifecycle } from "@/admin/_shared/AdminPWALifecycle";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  
  // PWA-оптимизированное управление жизненным циклом
  useAdminPWALifecycle('admin-users', () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users-optimized'] });
  });
  
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
    handleContextAction,
    handleDeleteUser
  } = useAdminUsersActions();

  // Используем единый оптимизированный хук
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
  
  // Dialog states
  const [editingUser, setEditingUser] = useState<ProfileType | null>(null);

  // Определяем нужно ли использовать виртуализацию (уменьшено до 30 элементов)
  const useVirtualization = useMemo(() => {
    return !isMobile && (usersData?.users.length || 0) > 30;
  }, [isMobile, usersData?.users.length]);

  // Вычисляем высоту контейнера для виртуализации
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100;
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
  const pendingUsersCount = usersData?.pendingUsersCount || 0;

  // Debugging log as requested
  useEffect(() => {
    if (!isLoading) {
      console.log('[AdminUsers] Data updated:', { 
        isLoading, 
        totalCount, 
        pendingUsersCount, 
        fetchedUsers: users.length 
      });
    }
  }, [isLoading, totalCount, pendingUsersCount, users.length]);

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
          <Card className={pendingUsersCount > 0 ? 'bg-[#FEC6A1]' : ''}>
            <SafeComponentLoader errorMessage="Ошибка загрузки заголовка">
              <AdminUsersHeader
                pendingUsersCount={pendingUsersCount}
                totalUsersCount={totalCount}
                isLoading={isLoading}
                isCompactMode={isCompactMode}
                onCompactModeChange={setIsCompactMode}
              />
            </SafeComponentLoader>
            
            <CardContent className="space-y-4">
              <SafeComponentLoader errorMessage="Ошибка загрузки фильтров">
                <EnhancedUserFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                  activeFiltersCount={activeFiltersCount}
                />
              </SafeComponentLoader>

              <SafeComponentLoader errorMessage="Ошибка загрузки действий">
                <BulkUserActions
                  selectedUsers={selectedUsers}
                  totalUsers={users.length}
                  onSelectAll={wrappedHandleSelectAll}
                  onClearSelection={handleClearSelection}
                  onBulkAction={wrappedHandleBulkAction}
                  onExport={wrappedHandleExportUsers}
                />
              </SafeComponentLoader>
              
              <div ref={containerRef}>
                <AdminUsersContent
                  isLoading={isLoading}
                  isMobile={isMobile}
                  users={users}
                  pageSize={pageSize}
                  isCompactMode={isCompactMode}
                  useVirtualization={useVirtualization}
                  containerHeight={containerHeight}
                  selectedUsers={selectedUsers}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  onSelectUser={handleSelectUser}
                  onContextAction={handleContextAction}
                  onEditUser={handleEditUser}
                  onQuickStatusChange={handleQuickStatusChange}
                  onOptStatusChange={handleOptStatusChange}
                  onDeleteUser={handleDeleteUser}
                />
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

          <SafeComponentLoader errorMessage="Ошибка загрузки диалогов">
            <AdminUsersDialogs
              editingUser={editingUser}
              ratingUser={null}
              onEditDialogClose={handleEditDialogClose}
              onRatingDialogClose={() => {}}
            />
          </SafeComponentLoader>
        </div>
      </AdminLayout>
    </AdminErrorBoundary>
  );
};

export default AdminUsers;
