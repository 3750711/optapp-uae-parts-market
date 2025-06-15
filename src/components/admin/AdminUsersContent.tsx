
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileType } from '@/components/profile/types';
import { UsersTableSkeleton } from '@/components/admin/UsersTableSkeleton';
import { SafeComponentLoader } from '@/components/admin/SafeComponentLoader';
import { MobileUserCard } from '@/components/admin/MobileUserCard';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { VirtualizedUsersTable } from '@/components/admin/VirtualizedUsersTable';
import { SortField, SortDirection } from '@/hooks/useAdminUsersState';

interface AdminUsersContentProps {
  isLoading: boolean;
  isMobile: boolean;
  users: ProfileType[];
  pageSize: number;
  isCompactMode: boolean;
  useVirtualization: boolean;
  containerHeight: number;
  selectedUsers: string[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onSelectUser: (userId: string) => void;
  onContextAction: (userId: string, action: string) => void;
  onEditUser: (user: ProfileType) => void;
  onQuickStatusChange: (userId: string, status: 'verified' | 'pending' | 'blocked') => void;
  onOptStatusChange: (userId: string, status: 'free_user' | 'opt_user') => void;
}

export const AdminUsersContent: React.FC<AdminUsersContentProps> = ({
  isLoading,
  isMobile,
  users,
  pageSize,
  isCompactMode,
  useVirtualization,
  containerHeight,
  selectedUsers,
  sortField,
  sortDirection,
  onSort,
  onSelectUser,
  onContextAction,
  onEditUser,
  onQuickStatusChange,
  onOptStatusChange,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return <UsersTableSkeleton rows={pageSize} isCompact={isCompactMode} />;
  }

  const commonTableProps = {
    users,
    isCompactMode,
    selectedUsers,
    sortField,
    sortDirection,
    onSort,
    onSelectUser,
    onQuickStatusChange,
    onOptStatusChange,
    onEditUser,
    onOpenProfile: (userId: string) => navigate(`/seller/${userId}`),
    onContextAction,
  };

  if (isMobile) {
    return (
      <SafeComponentLoader errorMessage="Ошибка отображения мобильных карточек">
        <div className="space-y-3">
          {users.map((user) => (
            <MobileUserCard
              key={user.id}
              user={user}
              isSelected={selectedUsers.includes(user.id)}
              onSelect={onSelectUser}
              onQuickAction={onContextAction}
              onOpenProfile={(userId) => navigate(`/seller/${userId}`)}
              onEdit={onEditUser}
              onRating={() => {}}
              onOptStatusChange={onOptStatusChange}
            />
          ))}
        </div>
      </SafeComponentLoader>
    );
  }

  if (useVirtualization) {
    return (
      <SafeComponentLoader 
        errorMessage="Ошибка виртуализации"
        fallback={<AdminUsersTable {...commonTableProps} />}
      >
        <VirtualizedUsersTable
          {...commonTableProps}
          height={containerHeight}
        />
        
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-green-600 mt-2">
            ⚡ Виртуализация активна для {users.length} пользователей
          </div>
        )}
      </SafeComponentLoader>
    );
  }

  return (
    <SafeComponentLoader errorMessage="Ошибка таблицы пользователей">
      <AdminUsersTable {...commonTableProps} />
    </SafeComponentLoader>
  );
};
