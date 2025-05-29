import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { useAdminUsersState } from '@/hooks/useAdminUsersState';
import { useAdminUsersActions } from '@/hooks/useAdminUsersActions';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
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
  
  // Dialog states
  const [editingUser, setEditingUser] = useState<ProfileType | null>(null);
  const [ratingUser, setRatingUser] = useState<ProfileType | null>(null);

  // Handle editing user
  const handleEditUser = (user: ProfileType) => {
    console.log("Setting editing user:", user);
    setEditingUser(user);
  };

  const handleEditDialogClose = () => {
    console.log("Closing edit dialog, invalidating cache");
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    setEditingUser(null);
  };

  const handleRatingDialogClose = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    setRatingUser(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'a':
            e.preventDefault();
            handleSelectAll(users.map(user => user.id));
            break;
          case 'e':
            e.preventDefault();
            handleExportUsers(users);
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

  const wrappedHandleBulkAction = (action: string) => {
    handleBulkAction(action, selectedUsers).then(() => {
      handleClearSelection();
    });
  };

  const wrappedHandleExportUsers = () => {
    handleExportUsers(users);
  };

  const wrappedHandleSelectAll = () => {
    handleSelectAll(users.map(user => user.id));
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <Card className={pendingUsersCount && pendingUsersCount > 0 ? 'bg-[#FEC6A1]' : ''}>
          <AdminUsersHeader
            pendingUsersCount={pendingUsersCount}
            isCompactMode={isCompactMode}
            onCompactModeChange={setIsCompactMode}
          />
          
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
              onSelectAll={wrappedHandleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkAction={wrappedHandleBulkAction}
              onExport={wrappedHandleExportUsers}
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
                    onOptStatusChange={handleOptStatusChange}
                  />
                ))}
              </div>
            ) : (
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
                onRatingUser={setRatingUser}
                onOpenProfile={(userId) => navigate(`/seller/${userId}`)}
                onContextAction={handleContextAction}
              />
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

        <AdminUsersDialogs
          editingUser={editingUser}
          ratingUser={ratingUser}
          onEditDialogClose={handleEditDialogClose}
          onRatingDialogClose={handleRatingDialogClose}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
