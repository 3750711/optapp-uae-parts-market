
import React from "react";
import { User, Star, StarHalf } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileType } from "./types";

interface ProfileHeaderProps {
  profile: ProfileType;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Профиль пользователя</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
        <Avatar className="h-32 w-32 mb-6">
          <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
          <AvatarFallback className="text-4xl bg-optapp-yellow text-optapp-dark">
            {profile?.full_name?.charAt(0) || <User size={32} />}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold">{profile?.full_name || 'Пользователь'}</h2>
        <div className="flex flex-wrap justify-center items-center gap-2 mt-2">
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
