
import React, { useState } from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserCheck, Edit, ExternalLink, Ban, UserCog, Star, Trash2, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ProfileType } from '@/components/profile/types';
import { UserAvatar } from './UserAvatar';
import { EnhancedStatusBadge } from './EnhancedStatusBadge';
import { CommunicationRatingBadge } from './CommunicationRatingBadge';
import { UserContextMenu } from './UserContextMenu';
import { SendTelegramMessageDialog } from './SendTelegramMessageDialog';
import { SafeComponentLoader } from './SafeComponentLoader';

interface AdminUsersTableRowProps {
  user: ProfileType;
  isCompactMode: boolean;
  isSelected: boolean;
  onSelect: (userId: string) => void;
  onQuickStatusChange: (userId: string, status: 'verified' | 'pending' | 'blocked') => void;
  onOptStatusChange: (userId: string, status: 'free_user' | 'opt_user') => void;
  onEditUser: (user: ProfileType) => void;
  onOpenProfile: (userId: string) => void;
  onContextAction: (userId: string, action: string) => void;
  onDeleteUser: (userId: string) => void;
}

export const AdminUsersTableRow: React.FC<AdminUsersTableRowProps> = ({
  user,
  isCompactMode,
  isSelected,
  onSelect,
  onQuickStatusChange,
  onOptStatusChange,
  onEditUser,
  onOpenProfile,
  onContextAction,
  onDeleteUser
}) => {
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);
  return (
    <UserContextMenu
      user={user}
      onQuickAction={onContextAction}
      onOpenProfile={onOpenProfile}
      onEdit={onEditUser}
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
              checked={isSelected}
              onChange={() => onSelect(user.id)}
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
        <TableCell className={isCompactMode ? 'py-2' : ''}>
          <CommunicationRatingBadge 
            rating={user.communication_ability} 
            size={isCompactMode ? 'sm' : 'md'}
          />
        </TableCell>
        <TableCell className={`${isCompactMode ? 'py-2' : ''} text-sm text-muted-foreground`}>
          {new Date(user.created_at).toLocaleDateString('ru-RU')}
        </TableCell>
        <TableCell className={isCompactMode ? 'py-2' : ''}>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenProfile(user.id)}
              className={`${isCompactMode ? 'h-7 w-7' : 'h-8 w-8'} hover:bg-blue-100`}
              title="Открыть публичный профиль"
            >
              <ExternalLink className={`${isCompactMode ? 'h-3 w-3' : 'h-4 w-4'} text-blue-600`} />
            </Button>

            {user.verification_status !== 'verified' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuickStatusChange(user.id, 'verified')}
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
                <DropdownMenuItem onClick={() => onEditUser(user)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
                {user.telegram_id && (
                  <DropdownMenuItem onClick={() => setShowTelegramDialog(true)}>
                    <Send className="mr-2 h-4 w-4 text-blue-600" />
                    Отправить сообщение
                  </DropdownMenuItem>
                )}
                {user.verification_status !== 'blocked' && (
                  <DropdownMenuItem
                    onClick={() => onQuickStatusChange(user.id, 'blocked')}
                  >
                    <Ban className="mr-2 h-4 w-4 text-red-600" />
                    Заблокировать
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onOptStatusChange(
                    user.id, 
                    user.opt_status === 'opt_user' ? 'free_user' : 'opt_user'
                  )}
                >
                  Переключить OPT статус
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (confirm(`Вы уверены, что хотите удалить аккаунт пользователя "${user.full_name || user.email}"? Это действие нельзя отменить.`)) {
                      onDeleteUser(user.id);
                    }
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить аккаунт
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      <SafeComponentLoader
        fallback={<div>Ошибка диалога сообщений</div>}
        errorMessage="Ошибка компонента отправки сообщений"
      >
        <SendTelegramMessageDialog
          user={user}
          open={showTelegramDialog}
          onOpenChange={setShowTelegramDialog}
        />
      </SafeComponentLoader>
    </UserContextMenu>
  );
};
