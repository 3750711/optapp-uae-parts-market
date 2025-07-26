
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ChevronLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import OptimizedProfileSidebar from "@/components/profile/OptimizedProfileSidebar";
import ProfileForm from "@/components/profile/ProfileForm";
import OptimizedProfileStats from "@/components/profile/OptimizedProfileStats";
import ProfileProgress from "@/components/profile/ProfileProgress";
import ProfileErrorBoundary from "@/components/profile/ErrorBoundary";
import { Button } from "@/components/ui/button";
import StoreEditForm from "@/components/store/StoreEditForm";
import { DeleteAccountButton } from "@/components/profile/DeleteAccountButton";
import { useOptimizedProfile } from "@/hooks/useOptimizedProfile";
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
import { getProfileTranslations } from "@/utils/profileTranslations";

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
  const { user, signOut, refreshProfile } = useAuth();
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  // Используем оптимизированный хук
  const { 
    data, 
    isLoading, 
    error, 
    refetch, 
    profile, 
    orderStats, 
    storeInfo 
  } = useOptimizedProfile();
  
  useEffect(() => {
    if (!user) {
      console.log("Profile: No user found, redirecting to login");
      navigate("/login");
    } else {
      console.log("Profile: User found:", user.id);
    }
  }, [user, navigate]);

  const handleSubmit = async (formData: FormData) => {
    if (!user) {
      console.error("Profile: No user found for form submission");
      return;
    }
    
    const t = getProfileTranslations(profile?.user_type || 'buyer');
    console.log("Profile: Starting form submission", formData);
    setIsFormLoading(true);
    
    try {
      // Проверяем, есть ли изменения в данных
      const hasChanges = profile && (
        profile.full_name !== formData.fullName ||
        profile.phone !== formData.phone ||
        profile.company_name !== formData.companyName ||
        profile.description_user !== formData.description
      );

      if (!hasChanges) {
        console.log("Profile: No changes detected, skipping update");
        toast({
          title: t.noChanges,
          description: t.noChangesDesc,
        });
        return;
      }

      console.log("Profile: Submitting profile update to Supabase");
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          company_name: formData.companyName,
          description_user: formData.description,
        })
        .eq('id', user.id);

      if (error) {
        console.error("Profile: Supabase update error:", error);
        throw error;
      }

      console.log("Profile: Profile updated successfully");
      await refreshProfile();
      await refetch(); // Обновляем кэш оптимизированного хука

      toast({
        title: t.profileUpdated,
        description: t.profileUpdatedDesc,
      });
    } catch (error: any) {
      console.error("Profile: Profile update error:", error);
      
      if (error.message.includes("profiles_opt_id_key")) {
        toast({
          title: t.updateError,
          description: t.optIdError,
          variant: "destructive",
        });
      } else {
        toast({
          title: t.updateError,
          description: error.message || "Произошла ошибка при обновлении данных",
          variant: "destructive",
        });
      }
      
      throw error;
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleAvatarUpdate = async (avatarUrl: string) => {
    if (!user) {
      console.error("Profile: No user found for avatar update");
      return;
    }
    
    try {
      console.log("Profile: Updating avatar", avatarUrl);
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl
        })
        .eq('id', user.id);
        
      if (error) {
        console.error("Profile: Avatar update error:", error);
        throw error;
      }
      
      console.log("Profile: Avatar updated successfully");
      await refreshProfile();
      await refetch(); // Обновляем кэш
    } catch (error: any) {
      console.error("Profile: Avatar update error:", error);
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
    const t = getProfileTranslations(profile?.user_type || 'buyer');
    try {
      console.log("Profile: Signing out user");
      await signOut();
      toast({
        title: t.signOutSuccess,
        description: t.signOutSuccessDesc,
      });
      navigate("/");
    } catch (error) {
      console.error("Profile: Ошибка при выходе:", error);
      toast({
        title: t.signOutError,
        description: t.signOutErrorDesc,
        variant: "destructive",
      });
    }
  };

  // Показываем лоадер только при первоначальной загрузке
  if (isLoading && !profile) {
    console.log("Profile: Showing loading state");
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    console.log("Profile: No profile found, showing error state");
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{getProfileTranslations('buyer').profileLoadError}</p>
          <Button onClick={() => refetch()}>
            {getProfileTranslations('buyer').retryLoad}
          </Button>
        </div>
        </div>
      </Layout>
    );
  }

  const isSeller = profile.user_type === 'seller';
  const t = getProfileTranslations(profile.user_type);
  console.log("Profile: Rendering profile page for user type:", profile.user_type);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4 hover:bg-gray-100" 
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> {t.back}
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-optapp-dark to-gray-700 bg-clip-text text-transparent">
              {t.myProfile}
            </h1>
          </div>

          <ProfileErrorBoundary>
            {/* Mobile Layout */}
            <div className="block lg:hidden space-y-6">
              <OptimizedProfileSidebar 
                profile={profile}
                isLoading={isLoading}
                onAvatarUpdate={handleAvatarUpdate}
              />
              <OptimizedProfileStats 
                profile={profile} 
                orderStats={orderStats}
                isLoading={isLoading}
              />
              <ProfileProgress profile={profile} />
              <ProfileForm
                profile={profile}
                onSubmit={handleSubmit}
                isLoading={isFormLoading}
                readOnlyUserType={true}
              />
              {isSeller && user && (
                <StoreEditForm sellerId={user.id} />
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-8">
              {/* Left Column - Profile Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                <OptimizedProfileSidebar 
                  profile={profile}
                  isLoading={isLoading}
                  onAvatarUpdate={handleAvatarUpdate}
                />
                <OptimizedProfileStats 
                  profile={profile} 
                  orderStats={orderStats}
                  isLoading={isLoading}
                />
              </div>

              {/* Right Column - Main Content */}
              <div className="lg:col-span-8 space-y-6">
              <ProfileProgress profile={profile} />
                
                <ProfileForm
                  profile={profile}
                  onSubmit={handleSubmit}
                  isLoading={isFormLoading}
                  readOnlyUserType={true}
                />
                
                {isSeller && user && (
                  <StoreEditForm sellerId={user.id} />
                )}
              </div>
            </div>
          </ProfileErrorBoundary>

          {/* Logout Button */}
          <div className="mt-8 flex justify-center">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-gray-500 text-xs flex items-center opacity-60 hover:opacity-80 transition-opacity"
              onClick={handleSignOutClick}
            >
              <LogOut className="mr-1 h-3 w-3" />
              {t.signOut}
            </Button>
          </div>
          
          <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.signOutConfirm}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.signOutConfirmDesc}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleSignOut}>{t.signOutBtn}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
