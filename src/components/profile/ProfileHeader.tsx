import React, { useState } from "react";
import { User, Star, StarHalf, Camera } from "lucide-react";
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
const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onAvatarUpdate
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const renderRatingStars = (rating: number | null) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => <Star key={`star-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
        {hasHalfStar && <StarHalf className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => <Star key={`empty-star-${i}`} className="h-5 w-5 text-gray-300" />)}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}/5</span>
      </div>;
  };
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Пожалуйста, выберите изображение"
      });
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Размер файла не должен превышать 2МБ"
      });
      return;
    }
    try {
      setIsUploading(true);

      // Create a unique file path in the format userId/timestamp-filename
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

      // Upload the file to Supabase storage
      const {
        data,
        error
      } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true
      });
      if (error) throw error;

      // Get the public URL for the uploaded file
      const {
        data: publicUrlData
      } = supabase.storage.from('avatars').getPublicUrl(data.path);

      // Call the onAvatarUpdate callback to update the profile in the database
      if (onAvatarUpdate) {
        await onAvatarUpdate(publicUrlData.publicUrl);
        toast({
          title: "Фото обновлено",
          description: "Ваш аватар успешно обновлен"
        });
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить изображение"
      });
    } finally {
      setIsUploading(false);
    }
  };
  return <Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 border shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Профиль пользователя</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
        <div className="relative mb-6">
          <div className="relative">
            <Avatar className="h-32 w-32 ring-4 ring-white shadow-lg">
              <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} className="object-cover" />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-optapp-yellow to-yellow-400 text-optapp-dark">
                {profile?.full_name?.charAt(0) || <User size={32} />}
              </AvatarFallback>
            </Avatar>
            
            {onAvatarUpdate && <div className="absolute bottom-0 right-0">
                <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-r from-optapp-yellow to-yellow-400 text-optapp-dark hover:from-yellow-400 hover:to-yellow-500 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                  {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                  <input 
                    type="file" 
                    accept="image/*,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.webp,.heic,.heif,.avif" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      handleAvatarUpload(e);
                      e.target.value = "";
                    }} 
                    disabled={isUploading} 
                  />
                </div>
              </div>}
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-optapp-dark to-gray-700 bg-clip-text text-slate-950">
              {profile?.full_name || 'Пользователь'}
            </h2>
            {profile?.opt_status === 'opt_user' && <span className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full text-sm font-medium shadow-sm">
                OPT
              </span>}
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-3">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium shadow-sm ${profile?.user_type === 'seller' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'}`}>
              {profile?.user_type === 'seller' ? 'Продавец' : 'Покупатель'}
            </span>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium shadow-sm ${profile?.verification_status === 'verified' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'}`}>
              {profile?.verification_status === 'verified' ? 'Проверено' : 'Ожидает проверки'}
            </span>
          </div>
        </div>

        {profile?.opt_id && <div className="mt-6 w-full max-w-xs">
            <div className="text-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border shadow-sm">
              <p className="text-sm text-gray-600 mb-2 font-medium">OPT ID:</p>
              <p className="text-lg font-bold text-optapp-dark bg-white px-4 py-2 rounded-lg shadow-sm">
                {profile?.opt_id}
              </p>
            </div>
          </div>}
        
        {profile?.rating && <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2 font-medium">Рейтинг:</p>
            {renderRatingStars(profile?.rating)}
          </div>}
      </CardContent>
    </Card>;
};
export default ProfileHeader;