import React from "react";
import { Button } from "@/components/ui/button";
import { ProfileType } from "./types";
import { Star } from "lucide-react";

interface ProfileActionsProps {
  profile: ProfileType;
  isLoading: boolean;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({ 
  profile,
}) => {
  const handleContactAdmin = () => {
    try {
      const userDataText = `I have a problem boss, my ID is ${profile.opt_id || 'Not specified'}`;
      const encodedText = encodeURIComponent(userDataText);
      
      // Creating a Telegram URL that works - the correct format is to use separate parameters
      window.open(`https://t.me/ElenaOPTcargo?start=${encodedText}`, '_blank');
    } catch (error) {
      window.open('https://t.me/ElenaOPTcargo', '_blank');
    }
  };

  return (
    <div className="mt-6 w-full space-y-4">
      <Button 
        onClick={handleContactAdmin}
        className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
      >
        Связаться с администратором
      </Button>
      
      {profile.user_type === 'seller' && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="font-medium text-lg mb-2">Рейтинг продавца</h3>
          <div className="flex items-center">
            {profile.rating ? (
              <>
                <div className="flex mr-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${i < Math.floor(profile.rating || 0) 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="font-bold">{profile.rating.toFixed(1)}</span>
                <span className="text-gray-500 ml-1">/5</span>
              </>
            ) : (
              <span className="text-gray-500">Пока нет оценок</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileActions;
