
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileType } from '@/components/profile/types';
import { UserAvatar } from './UserAvatar';
import { EnhancedStatusBadge } from './EnhancedStatusBadge';
import { Star, ExternalLink, MoreVertical } from 'lucide-react';
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
}

export const MobileUserCard: React.FC<MobileUserCardProps> = ({
  user,
  isSelected,
  onSelect,
  onQuickAction,
  onOpenProfile,
  onEdit,
  onRating
}) => {
  const handleEdit = () => {
    console.log("Mobile card edit clicked for user:", user.id);
    onEdit(user);
  };

  const handleRating = () => {
    console.log("Mobile card rating clicked for user:", user.id);
    onRating(user);
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
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(user.id)}
            className="mt-1"
          />
          
          <UserAvatar user={user} size="md" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">
                  {user.full_name || 'Без имени'}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
                {user.company_name && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {user.company_name}
                  </p>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpenProfile(user.id)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Открыть профиль
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    Редактировать
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleRating}>
                    Изменить рейтинг
                  </DropdownMenuItem>
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
            
            <div className="flex flex-wrap gap-2 mt-2">
              <EnhancedStatusBadge 
                type="userType" 
                value={user.user_type} 
                size="sm"
              />
              <EnhancedStatusBadge 
                type="verification" 
                value={user.verification_status} 
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
            
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {user.rating !== null ? (
                  <>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span>{user.rating.toFixed(1)}</span>
                  </>
                ) : (
                  <span>Без рейтинга</span>
                )}
              </div>
              <span>{new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            
            {user.opt_id && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  OPT: {user.opt_id}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
