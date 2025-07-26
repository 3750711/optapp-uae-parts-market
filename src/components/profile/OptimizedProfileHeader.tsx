
import React, { useState, memo } from "react";
import { User, Star, StarHalf, Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileType } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getProfileTranslations } from "@/utils/profileTranslations";

interface OptimizedProfileHeaderProps {
  profile: ProfileType;
  onAvatarUpdate?: (avatarUrl: string) => Promise<void>;
  isLoading?: boolean;
}

const OptimizedProfileHeader: React.FC<OptimizedProfileHeaderProps> = memo(({
  profile,
  onAvatarUpdate,
  isLoading = false
}) => {
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

    const t = getProfileTranslations(profile.user_type);

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: t.uploadError,
        description: t.selectImage
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: t.uploadError,
        description: t.fileSizeError
      });
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      if (onAvatarUpdate) {
        await onAvatarUpdate(publicUrlData.publicUrl);
        toast({
          title: t.avatarUpdated,
          description: t.avatarUpdatedDesc
        });
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        variant: "destructive",
        title: t.uploadError,
        description: error.message || "Не удалось загрузить изображение"
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    const t = getProfileTranslations('buyer');
    return (
      <Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{t.userProfile}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
          <div className="animate-pulse space-y-4 w-full max-w-xs">
            <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="flex justify-center space-x-2">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const t = getProfileTranslations(profile.user_type);
  
  return (
    <Card className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 border shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{t.userProfile}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
        <div className="relative mb-6">
          <div className="relative">
            <Avatar className="h-32 w-32 ring-4 ring-white shadow-lg">
              <AvatarImage 
                src={profile?.avatar_url || ''} 
                alt={profile?.full_name || 'User'} 
                className="object-cover" 
              />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-optapp-yellow to-yellow-400 text-optapp-dark">
                {profile?.full_name?.charAt(0) || <User size={32} />}
              </AvatarFallback>
            </Avatar>
            
            {onAvatarUpdate && (
              <div className="absolute bottom-0 right-0">
                <label 
                  htmlFor="avatar-upload" 
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-r from-optapp-yellow to-yellow-400 text-optapp-dark hover:from-yellow-400 hover:to-yellow-500 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
        </div>
        
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 drop-shadow-sm">
              {profile?.full_name || 'Пользователь'}
            </h2>
            {profile?.opt_status === 'opt_user' && (
              <span className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full text-sm font-medium shadow-sm">
                OPT
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-3">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
              profile?.user_type === 'seller' 
                ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' 
                : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
            }`}>
              {profile?.user_type === 'seller' ? t.seller : t.buyer}
            </span>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
              profile?.verification_status === 'verified' 
                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' 
                : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'
            }`}>
              {profile?.verification_status === 'verified' ? t.verified : t.pendingVerification}
            </span>
          </div>
        </div>

        {profile?.opt_id && (
          <div className="mt-6 w-full max-w-xs">
            <div className="text-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border shadow-sm">
              <p className="text-sm text-gray-600 mb-2 font-medium">OPT ID:</p>
              <p className="text-lg font-bold text-optapp-dark bg-white px-4 py-2 rounded-lg shadow-sm">
                {profile?.opt_id}
              </p>
            </div>
          </div>
        )}
        
        {profile?.rating && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2 font-medium">{t.rating}:</p>
            {renderRatingStars(profile?.rating)}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OptimizedProfileHeader.displayName = "OptimizedProfileHeader";

export default OptimizedProfileHeader;
