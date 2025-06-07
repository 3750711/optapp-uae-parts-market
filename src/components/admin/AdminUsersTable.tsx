import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ProfileType } from '@/components/profile/types';
import { AdminUsersTableRow } from './AdminUsersTableRow';
import { SortField, SortDirection } from '@/hooks/useAdminUsersState';

interface AdminUsersTableProps {
  users: ProfileType[];
  isCompactMode: boolean;
  selectedUsers: string[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onSelectUser: (userId: string) => void;
  onQuickStatusChange: (userId: string, status: 'verified' | 'pending' | 'blocked') => void;
  onOptStatusChange: (userId: string, status: 'free_user' | 'opt_user') => void;
  onEditUser: (user: ProfileType) => void;
  onOpenProfile: (userId: string) => void;
  onContextAction: (userId: string, action: string) => void;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({
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
  onOpenProfile,
  onContextAction
}) => {
  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? 
        <ChevronUp size={16} /> : 
        <ChevronDown size={16} />;
    }
    return null;
  };

  return (
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
              onClick={() => onSort('email')}
            >
              <div className="flex items-center">
                Email {renderSortIcon('email')}
              </div>
            </TableHead>
            <TableHead 
              className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
              onClick={() => onSort('opt_id')}
            >
              <div className="flex items-center">
                OPT_ID {renderSortIcon('opt_id')}
              </div>
            </TableHead>
            <TableHead 
              className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
              onClick={() => onSort('user_type')}
            >
              <div className="flex items-center">
                Тип {renderSortIcon('user_type')}
              </div>
            </TableHead>
            <TableHead 
              className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
              onClick={() => onSort('verification_status')}
            >
              <div className="flex items-center">
                Статус {renderSortIcon('verification_status')}
              </div>
            </TableHead>
            <TableHead 
              className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
              onClick={() => onSort('opt_status')}
            >
              <div className="flex items-center">
                OPT Статус {renderSortIcon('opt_status')}
              </div>
            </TableHead>
            <TableHead 
              className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
              onClick={() => onSort('rating')}
            >
              <div className="flex items-center">
                Рейтинг {renderSortIcon('rating')}
              </div>
            </TableHead>
            <TableHead 
              className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
              onClick={() => onSort('communication_ability')}
            >
              <div className="flex items-center">
                Коммуникация {renderSortIcon('communication_ability')}
              </div>
            </TableHead>
            <TableHead 
              className={`cursor-pointer ${isCompactMode ? 'py-2' : ''}`}
              onClick={() => onSort('created_at')}
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
            <AdminUsersTableRow
              key={user.id}
              user={user}
              isCompactMode={isCompactMode}
              isSelected={selectedUsers.includes(user.id)}
              onSelect={onSelectUser}
              onQuickStatusChange={onQuickStatusChange}
              onOptStatusChange={onOptStatusChange}
              onEditUser={onEditUser}
              onOpenProfile={onOpenProfile}
              onContextAction={onContextAction}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
