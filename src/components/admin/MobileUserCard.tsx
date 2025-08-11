
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileType } from '@/components/profile/types';
import { UserAvatar } from './UserAvatar';
import { EnhancedStatusBadge } from './EnhancedStatusBadge';
import { Star, ExternalLink, MoreVertical, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileUserCardProps {
  user: ProfileType;
  isSelected: boolean;
  onSelect: (userId: string) => void;
  onQuickAction: (userId: string, action: string) => void;
  onOpenProfile: (userId: string) => void;
  onEdit: (user: ProfileType) => void;
  onRating: (user: ProfileType) => void;
  onOptStatusChange?: (userId: string, newStatus: 'free_user' | 'opt_user') => void;
}

export const MobileUserCard: React.FC<MobileUserCardProps> = ({
  user,
  isSelected,
  onSelect,
  onQuickAction,
  onOpenProfile,
  onEdit,
  onRating,
  onOptStatusChange
}) => {
  const handleEdit = () => {
    console.log("Mobile card edit clicked for user:", user.id);
    onEdit(user);
  };

  const handleRating = () => {
    console.log("Mobile card rating clicked for user:", user.id);
    onRating(user);
  };

  const handleOptStatusToggle = () => {
    if (onOptStatusChange) {
      const newStatus = user.opt_status === 'opt_user' ? 'free_user' : 'opt_user';
      onOptStatusChange(user.id, newStatus);
    }
  };

  return (
    <Card className={`transition-all duration-200 ${
      user.verification_status === 'pending'
        ? 'bg-orange-50 border-orange-200'
        : user.verification_status === 'verified'
        ? 'bg-green-50 border-green-200'
        : user.verification_status === 'blocked'
        ? 'bg-red-50 border-red-200'
        : ''
    }`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(user.id)}
              className="mt-1"
            />
            <UserAvatar user={user} size="md" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base truncate flex items-center gap-1">
                  <span className="truncate">{user.full_name || 'Без имени'}</span>
                  {user.telegram_id && (
                    user.telegram ? (
                      <a
                        href={`https://t.me/${user.telegram.replace('@','')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:opacity-80"
                        title={`Открыть Telegram ${user.telegram.replace('@','@')}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-primary/80" title="Привязан Telegram">
                        <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    )
                  )}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
                {user.opt_id && (
                  <Badge variant="outline" className="text-xs mt-1.5 font-mono">
                    OPT: {user.opt_id}
                  </Badge>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpenProfile(user.id)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Профиль
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    Редактировать
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRating}>
                    Рейтинг
                  </DropdownMenuItem>
                  {onOptStatusChange && (
                    <DropdownMenuItem onClick={handleOptStatusToggle}>
                      Переключить OPT
                    </DropdownMenuItem>
                  )}
                  {user.verification_status !== 'verified' && (
                    <DropdownMenuItem onClick={() => onQuickAction(user.id, 'verify')}>
                      Подтвердить
                    </DropdownMenuItem>
                  )}
                  {user.verification_status !== 'blocked' && (
                    <DropdownMenuItem onClick={() => onQuickAction(user.id, 'block')}>
                      Заблокировать
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mt-2">
               <EnhancedStatusBadge 
                type="verification" 
                value={user.verification_status} 
                size="sm"
              />
              <EnhancedStatusBadge 
                type="userType" 
                value={user.user_type} 
                size="sm"
              />
              {user.opt_status && (
                <EnhancedStatusBadge 
                  type="optStatus" 
                  value={user.opt_status} 
                  size="sm"
                />
              )}
            </div>
            
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {user.rating !== null ? (
                  <>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{user.rating.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-xs">Без рейтинга</span>
                )}
              </div>
              <span>{new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
