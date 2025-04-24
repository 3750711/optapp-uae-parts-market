import React, { useState } from "react";
import { User, Star, StarHalf, Camera, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileType } from "./types";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ProfileHeaderProps {
  profile: ProfileType;
  onAvatarUpdate?: (avatarUrl: string) => Promise<void>;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onAvatarUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  
  const renderRatingStars = (rating: number | null) => {
    if (!rating) return null;
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`star-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && <StarHalf className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-star-${i}`} className="h-5 w-5 text-gray-300" />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}/5</span>
      </div>
    );
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Пожалуйста, выберите изображение",
      });
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Размер файла не должен превышать 2МБ",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Create a unique file path in the format userId/timestamp-filename
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${Date.now()}.${fileExt}`;
      
      // Upload the file to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (error) throw error;
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);
      
      // Call the onAvatarUpdate callback to update the profile in the database
      if (onAvatarUpdate) {
        await onAvatarUpdate(publicUrlData.publicUrl);
        
        toast({
          title: "Фото обновлено",
          description: "Ваш аватар успешно обновлен",
        });
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить изображение",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Профиль пользователя</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
        <div className="relative mb-6">
          <Avatar className="h-32 w-32">
            <AvatarImage 
              src={profile?.avatar_url || ''} 
              alt={profile?.full_name || 'User'} 
            />
            <AvatarFallback className="text-4xl bg-optapp-yellow text-optapp-dark">
              {profile?.full_name?.charAt(0) || <User size={32} />}
            </AvatarFallback>
          </Avatar>
          
          {onAvatarUpdate && (
            <div className="absolute bottom-0 right-0">
              <label 
                htmlFor="avatar-upload" 
                className="flex items-center justify-center h-10 w-10 rounded-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{profile?.full_name || 'Пользователь'}</h2>
            {profile?.opt_status === 'opt_user' && (
              <div className="flex items-center text-yellow-600">
                <Crown className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">OPTSELLER</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-2">
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              profile?.user_type === 'seller' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {profile?.user_type === 'seller' ? 'Продавец' : 'Покупатель'}
            </span>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${
              profile?.verification_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {profile?.verification_status === 'verified' ? 'Проверено' : 'Ожидает проверки'}
            </span>
          </div>
        </div>

        {profile?.opt_id && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 mb-1">OPT ID:</p>
            <p className="text-lg font-semibold p-2 bg-gray-100 rounded-md">{profile?.opt_id}</p>
          </div>
        )}
        
        {profile?.rating && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Рейтинг:</p>
            {renderRatingStars(profile?.rating)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
