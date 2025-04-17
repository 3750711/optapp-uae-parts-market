import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import Layout from "@/components/layout/Layout";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import ProfileSidebar from "@/components/profile/ProfileSidebar";
import ProfileForm from "@/components/profile/ProfileForm";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Имя должно содержать не менее 2 символов" }).optional(),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  telegram: z.string().optional(),
  optId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const Profile = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

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
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

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

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <ProfileSidebar 
            profile={profile}
            isLoading={isLoading}
            onAvatarUpdate={handleAvatarUpdate}
          />
          <div className="w-full md:w-2/3">
            <ProfileForm
              profile={profile}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
