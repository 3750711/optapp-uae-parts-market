import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ProfileType } from '@/components/profile/types';
import { AdminUsersTableRow } from './AdminUsersTableRow';
import { SortField, SortDirection } from '@/hooks/useAdminUsersState';
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp } from 'lucide-react';

interface VirtualizedUsersTableProps {
  users: ProfileType[];
  height: number;
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
  onDeleteUser: (userId: string) => void;
}

const ROW_HEIGHT = 60;
const ROW_HEIGHT_NORMAL = 80;

export const VirtualizedUsersTable: React.FC<VirtualizedUsersTableProps> = ({
  users,
  height,
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
  onContextAction,
  onDeleteUser
}) => {
  const itemHeight = isCompactMode ? ROW_HEIGHT : ROW_HEIGHT_NORMAL;

  const renderSortIcon = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? 
        <ChevronUp size={16} /> : 
        <ChevronDown size={16} />;
    }
    return null;
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const user = users[index];
    
    if (!user) {
      return (
        <div style={style} className="flex items-center justify-center text-gray-500">
          Ошибка загрузки пользователя
        </div>
      );
    }
    
    return (
      <div style={style}>
        <AdminUsersTableRow
          user={user}
          isCompactMode={isCompactMode}
          isSelected={selectedUsers.includes(user.id)}
          onSelect={onSelectUser}
          onQuickStatusChange={onQuickStatusChange}
          onOptStatusChange={onOptStatusChange}
          onEditUser={onEditUser}
          onOpenProfile={onOpenProfile}
          onContextAction={onContextAction}
          onDeleteUser={onDeleteUser}
        />
      </div>
    );
  };

  const MemoizedRow = React.memo(Row);

  // Fallback для случаев когда виртуализация не нужна
  if (users.length === 0) {
    return (
      <div className="w-full">
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
        </Table>
        <div className="text-center text-sm text-gray-500 py-8">
          Нет данных для отображения
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Заголовок таблицы */}
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
      </Table>

      {/* Виртуализированный список */}
      <div className="border border-t-0">
        <List
          height={height}
          width="100%"
          itemCount={users.length}
          itemSize={itemHeight}
          overscanCount={5}
          itemData={users}
        >
          {MemoizedRow}
        </List>
      </div>
      
      {/* Информация о производительности */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2">
          Виртуализация: отображается {Math.min(Math.ceil(height / itemHeight) + 10, users.length)} из {users.length} строк
        </div>
      )}
    </div>
  );
};
