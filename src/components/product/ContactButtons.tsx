import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface ContactButtonsProps {
  sellerProfile: any;
  sellerName: string;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({ sellerProfile, sellerName }) => {
  const { user } = useAuth();
  const [isContacting, setIsContacting] = useState(false);

  const handleContactSeller = async () => {
    setIsContacting(true);
    try {
      // Logic to contact the seller (e.g., open a chat, send a message)
      console.log(`Contacting seller: ${sellerName}`);
    } catch (error) {
      console.error("Error contacting seller:", error);
    } finally {
      setIsContacting(false);
    }
  };

  const handleCallSeller = () => {
    if (sellerProfile?.phone) {
      window.location.href = `tel:${sellerProfile.phone}`;
    } else {
      alert("Номер телефона продавца не указан.");
    }
  };

  const handleEmailSeller = () => {
    if (sellerProfile?.email) {
      window.location.href = `mailto:${sellerProfile.email}`;
    } else {
      alert("Email адрес продавца не указан.");
    }
  };

  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={handleContactSeller} 
        disabled={isContacting}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Написать
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={handleCallSeller}
      >
        <Phone className="h-4 w-4 mr-2" />
        Позвонить
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleEmailSeller}
      >
        <Mail className="h-4 w-4 mr-2" />
        Email
      </Button>
    </div>
  );
};

export default ContactButtons;
