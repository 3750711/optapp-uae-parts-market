
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileType } from "./types";
import { Star, StarHalf } from "lucide-react";
import { getProfileTranslations } from "@/utils/profileTranslations";
import { useLanguage } from "@/hooks/useLanguage";

interface ProfileInfoProps {
  profile: ProfileType;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  const { language } = useLanguage();
  const t = getProfileTranslations(language);
  
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
        <CardTitle>{t.accountInfo}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">{t.registrationDate}</p>
            <p>{new Date(profile?.created_at || '').toLocaleDateString()}</p>
          </div>
          {profile?.last_login && (
            <div>
              <p className="text-sm text-gray-500">{t.lastLogin}</p>
              <p>{new Date(profile?.last_login).toLocaleDateString()}</p>
            </div>
          )}
          {profile?.user_type === 'seller' && (
            <>
              <div>
                <p className="text-sm text-gray-500">{t.listingCount}</p>
                <p>{profile?.listing_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t.sellerRating}</p>
                {profile?.rating ? renderRatingStars(profile?.rating) : <p>{t.noRatingsYet}</p>}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileInfo;
