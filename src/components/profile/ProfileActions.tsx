import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ProfileActionsProps {
  profileId: string;
  onProfileUpdate?: () => void;
  onProfileDelete?: () => void;
  isCurrentUser: boolean;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({ 
  profileId, 
  onProfileUpdate, 
  onProfileDelete,
  isCurrentUser
}) => {
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleEditClick = () => {
    navigate('/profile');
  };

  const handleViewStoreClick = () => {
    navigate(`/public-seller-profile/${profileId}`);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        console.error("Ошибка при удалении профиля:", error);
        toast({
          title: "Ошибка удаления",
          description: "Не удалось удалить профиль. Пожалуйста, попробуйте снова.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Профиль удален",
        description: "Профиль успешно удален.",
      });

      setDeleteDialogOpen(false);
      if (onProfileDelete) {
        onProfileDelete();
      }
    } catch (error) {
      console.error("Ошибка при удалении профиля:", error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить профиль. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Открыть меню</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isCurrentUser && (
            <DropdownMenuItem onClick={handleEditClick}>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
            </DropdownMenuItem>
          )}
          {!isCurrentUser && (
            <DropdownMenuItem onClick={handleViewStoreClick}>
              <Eye className="mr-2 h-4 w-4" />
              Посмотреть
            </DropdownMenuItem>
          )}
          {user?.user_metadata?.role === 'admin' && (
            <DropdownMenuItem onClick={handleDeleteClick}>
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Вы уверены, что хотите удалить этот профиль?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProfile}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileActions;
