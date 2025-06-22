import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { AuthDialog } from './seller/AuthDialog';

interface ContactButtonsProps {
  telegram: string | null;
  phone: string | null;
}

export const ContactButtons: React.FC<ContactButtonsProps> = ({ telegram, phone }) => {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);

  if (!telegram && !phone) {
    return null;
  }

  if (!user) {
    return (
      <>
        <AuthDialog open={open} setOpen={setOpen} />
        <Button onClick={() => setOpen(true)} variant="outline" className="w-full">
          <MessageCircle className="mr-2 h-4 w-4" />
          Связаться
        </Button>
      </>
    );
  }

  return (
    <div className="flex space-x-2">
      {telegram && (
        <Button asChild variant="outline" className="w-full">
          <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            Telegram
          </a>
        </Button>
      )}
      {phone && (
        <Button asChild variant="outline" className="w-full">
          <a href={`tel:${phone}`}>
            <Phone className="mr-2 h-4 w-4" />
            Позвонить
          </a>
        </Button>
      )}
    </div>
  );
};
