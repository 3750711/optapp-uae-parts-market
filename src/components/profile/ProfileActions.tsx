
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileType } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCog, Settings, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { DeleteAccountButton } from "./DeleteAccountButton";

interface ProfileActionsProps {
  profile: ProfileType;
  isLoading: boolean;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({ profile, isLoading }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useAdminAccess();
  
  const isOwnProfile = user?.id === profile.id;
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось выйти из системы",
      });
    }
  };
  
  const copyProfileLink = () => {
    // Создаем ссылку на профиль пользователя
    const profileUrl = `${window.location.origin}/profile/${profile.opt_id || profile.id}`;
    navigator.clipboard.writeText(profileUrl).then(
      function() {
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на профиль скопирована в буфер обмена",
        });
      },
      function() {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось скопировать ссылку",
        });
      }
    );
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
              className="w-full text-gray-500 border-gray-300 hover:bg-gray-100 hover:text-gray-700"
              variant="outline"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="h-4 w-4 mr-2" /> Выйти из системы
            </Button>
            
            {profile.user_type === 'seller' && (
              <Button 
                className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                onClick={() => navigate('/seller/dashboard')}
              >
                <UserCog className="h-4 w-4 mr-2" /> Панель продавца
              </Button>
            )}
            
            {isAdmin && (
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/admin')}
              >
                <Settings className="h-4 w-4 mr-2" /> Панель администратора
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={copyProfileLink}
            >
              <Share2 className="h-4 w-4 mr-2" /> Поделиться профилем
            </Button>

            <DeleteAccountButton />
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full">Действия</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={copyProfileLink}>
                <Share2 className="h-4 w-4 mr-2" /> Поделиться профилем
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileActions;
