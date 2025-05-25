
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ProfileType } from '@/components/profile/types';
import { UserCheck, Ban, UserX, ExternalLink, Edit, Star } from 'lucide-react';

interface UserContextMenuProps {
  user: ProfileType;
  children: React.ReactNode;
  onQuickAction: (userId: string, action: string) => void;
  onOpenProfile: (userId: string) => void;
  onEdit: (user: ProfileType) => void;
  onRating: (user: ProfileType) => void;
}

export const UserContextMenu: React.FC<UserContextMenuProps> = ({
  user,
  children,
  onQuickAction,
  onOpenProfile,
  onEdit,
  onRating
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onOpenProfile(user.id)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Открыть профиль
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onEdit(user)}>
          <Edit className="mr-2 h-4 w-4" />
          Редактировать
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onRating(user)}>
          <Star className="mr-2 h-4 w-4" />
          Изменить рейтинг
        </ContextMenuItem>
        <ContextMenuSeparator />
        {user.verification_status !== 'verified' && (
          <ContextMenuItem onClick={() => onQuickAction(user.id, 'verify')}>
            <UserCheck className="mr-2 h-4 w-4 text-green-600" />
            Подтвердить
          </ContextMenuItem>
        )}
        {user.verification_status !== 'blocked' && (
          <ContextMenuItem onClick={() => onQuickAction(user.id, 'block')}>
            <Ban className="mr-2 h-4 w-4 text-red-600" />
            Заблокировать
          </ContextMenuItem>
        )}
        {user.verification_status !== 'pending' && (
          <ContextMenuItem onClick={() => onQuickAction(user.id, 'pending')}>
            <UserX className="mr-2 h-4 w-4 text-orange-600" />
            Сбросить статус
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
