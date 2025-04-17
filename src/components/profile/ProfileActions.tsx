
import React from "react";
import { Button } from "@/components/ui/button";
import { ProfileType } from "./types";

interface ProfileActionsProps {
  profile: ProfileType;
  isLoading: boolean;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({ 
  profile,
}) => {
  const handleContactAdmin = () => {
    // Try to open Telegram with the user's data
    try {
      const userDataText = `
Имя: ${profile.full_name || 'Не указано'}
Email: ${profile.email}
OPT ID: ${profile.opt_id || 'Не указан'}
      `.trim();

      const encodedText = encodeURIComponent(userDataText);
      const telegramUrl = `https://t.me/ElenaOPTcargo?text=${encodedText}`;
      window.open(telegramUrl, '_blank');
    } catch (error) {
      // Fallback to just opening the chat without a message
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
    </div>
  );
};

export default ProfileActions;
