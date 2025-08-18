
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileType } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCog, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { DeleteAccountButton } from "./DeleteAccountButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProfileActionsProps {
  profile: ProfileType;
  isLoading: boolean;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({ profile, isLoading }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useAdminAccess();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  const isOwnProfile = user?.id === profile.id;
  
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast({
        title: "Успешно",
        description: "Вы вышли из системы",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось выйти из системы",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Действия</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isOwnProfile ? (
          <>
            <Button
              className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300"
              variant="outline"
              onClick={handleLogoutClick}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4 mr-2" /> Выйти из системы
            </Button>
            
            {profile.user_type === 'seller' && (
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate('/seller/profile')}
              >
                <UserCog className="h-4 w-4 mr-2" /> Панель продавца
              </Button>
            )}
            
            {isAdmin && (
              <Button 
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => navigate('/admin')}
              >
                <Settings className="h-4 w-4 mr-2" /> Панель администратора
              </Button>
            )}

            <DeleteAccountButton />
            
            <AlertDialog 
              open={logoutDialogOpen} 
              onOpenChange={setLogoutDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Выйти из системы</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы уверены, что хотите выйти из системы?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>Выйти</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full">Действия</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {/* Empty dropdown for now */}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileActions;
