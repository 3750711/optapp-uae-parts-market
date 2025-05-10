import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ChevronLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ProfileForm from "@/components/profile/ProfileForm";
import { Button } from "@/components/ui/button";
import StoreEditForm from "@/components/store/StoreEditForm";
import { UserType } from "@/components/profile/types";
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

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Имя должно содержать не менее 2 символов" }).optional(),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  telegram: z.string().optional(),
  optId: z.string().optional(),
  description: z.string().max(500, { message: "Описание не должно превышать 500 символов" }).optional(),
});

type FormData = z.infer<typeof formSchema>;

const Profile = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
    console.log("Current profile in Profile page:", profile);
  }, [user, navigate, profile]);

  const handleSubmit = async (data: FormData) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          phone: data.phone,
          company_name: data.companyName,
          telegram: data.telegram,
          opt_id: data.optId === "" ? null : data.optId,
          description_user: data.description,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      await refreshProfile();

      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      });
    } catch (error: any) {
      console.error("Profile update error:", error);
      
      if (error.message.includes("profiles_opt_id_key")) {
        toast({
          title: "Ошибка обновления",
          description: "OPT ID уже используется другим пользователем",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка обновления",
          description: error.message || "Произошла ошибка при обновлении данных",
          variant: "destructive",
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpdate = async (avatarUrl: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      await refreshProfile();
    } catch (error: any) {
      console.error("Avatar update error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка обновления аватара",
        description: error.message || "Не удалось обновить аватар",
      });
      throw error;
    }
  };

  const handleSignOutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Вы вышли из аккаунта",
        description: "До свидания!",
      });
      navigate("/");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      toast({
        title: "Ошибка выхода",
        description: "Не удалось выйти из аккаунта. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
    }
  };

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  const isSeller = profile.user_type === 'seller';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
          <h1 className="text-2xl font-bold">Мой профиль</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <ProfileSidebar 
            profile={profile}
            isLoading={isLoading}
            onAvatarUpdate={handleAvatarUpdate}
          />
          <div className="w-full md:w-2/3 space-y-8">
            <ProfileForm
              profile={profile}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              readOnlyUserType={true}
            />
            
            {isSeller && user && (
              <div className="mt-8">
                <StoreEditForm sellerId={user.id} />
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              className="mt-4 text-gray-400 hover:text-gray-500 text-xs flex items-center opacity-60"
              onClick={handleSignOutClick}
            >
              <LogOut className="mr-1 h-3 w-3" />
              Выйти из аккаунта
            </Button>
            
            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Выйти из аккаунта</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы уверены, что хотите выйти из аккаунта?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOut}>Выйти</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
