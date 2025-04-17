
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileType } from "./types";
import { Star, StarHalf } from "lucide-react";

interface ProfileInfoProps {
  profile: ProfileType;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
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
        <CardTitle>Информация аккаунта</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Дата регистрации</p>
            <p>{new Date(profile?.created_at || '').toLocaleDateString()}</p>
          </div>
          {profile?.last_login && (
            <div>
              <p className="text-sm text-gray-500">Последний вход</p>
              <p>{new Date(profile?.last_login).toLocaleDateString()}</p>
            </div>
          )}
          {profile?.user_type === 'seller' && (
            <>
              <div>
                <p className="text-sm text-gray-500">Количество объявлений</p>
                <p>{profile?.listing_count}</p>
              </div>
              {profile?.rating && (
                <div>
                  <p className="text-sm text-gray-500">Рейтинг</p>
                  {renderRatingStars(profile?.rating)}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileInfo;
