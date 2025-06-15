
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Keyboard } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminUsersHeaderProps {
  pendingUsersCount: number | undefined;
  totalUsersCount: number | undefined;
  isLoading: boolean;
  isCompactMode: boolean;
  onCompactModeChange: (checked: boolean) => void;
}

export const AdminUsersHeader: React.FC<AdminUsersHeaderProps> = ({
  pendingUsersCount,
  totalUsersCount,
  isLoading,
  isCompactMode,
  onCompactModeChange
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  return (
    <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <CardTitle>Пользователи</CardTitle>
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-24" />
          </>
        ) : (
          <>
            <Badge variant="outline">Всего: {totalUsersCount ?? '...'}</Badge>
            {pendingUsersCount !== undefined && pendingUsersCount > 0 && (
              <Badge variant="secondary">{pendingUsersCount} ожидает</Badge>
            )}
          </>
        )}
      </div>
      
      {!isMobile && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch 
              id="compact-mode" 
              checked={isCompactMode}
              onCheckedChange={onCompactModeChange}
            />
            <Label htmlFor="compact-mode" className="text-sm whitespace-nowrap">
              Компактный вид
            </Label>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => toast({
            title: "Горячие клавиши",
            description: "Ctrl+A - выбрать все, Ctrl+E - экспорт, Ctrl+F - поиск"
          })}>
            <Keyboard className="h-4 w-4 mr-1" />
            Подсказки
          </Button>
        </div>
      )}
    </CardHeader>
  );
};
