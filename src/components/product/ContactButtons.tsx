import React, { useState } from 'react';
import { MessageCircle, Phone, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from './seller/AuthDialog';

interface ContactButtonsProps {
  sellerPhone?: string;
  sellerTelegram?: string;
  sellerId: string;
  productTitle: string;
  isVerified?: boolean;
  verificationStatus?: string;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({
  sellerPhone,
  sellerTelegram,
  sellerId,
  productTitle,
  isVerified = false,
  verificationStatus = 'pending'
}) => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCopyPhone = () => {
    if (sellerPhone) {
      navigator.clipboard.writeText(sellerPhone);
      toast({
        title: "Скопировано",
        description: "Номер телефона скопирован в буфер обмена",
      });
    }
  };

  const handleCopyTelegram = () => {
    if (sellerTelegram) {
      navigator.clipboard.writeText(sellerTelegram);
      toast({
        title: "Скопировано", 
        description: "Telegram скопирован в буфер обмена",
      });
    }
  };

  const handleContactAction = (action: () => void) => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    action();
  };

  const handleGoToLogin = () => {
    window.location.href = '/login';
  };

  const formatPhone = (phone: string) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as +971 XX XXX XXXX for UAE numbers
    if (cleaned.startsWith('971') && cleaned.length === 12) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    
    // Return original if not UAE format
    return phone;
  };

  const formatTelegram = (telegram: string) => {
    // Remove @ if present and add it back
    const cleaned = telegram.replace(/^@/, '');
    return `@${cleaned}`;
  };

  const getTelegramUrl = (telegram: string) => {
    const username = telegram.replace(/^@/, '');
    return `https://t.me/${username}`;
  };

  const getWhatsAppUrl = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Здравствуйте! Меня интересует товар: ${productTitle}`);
    return `https://wa.me/${cleaned}?text=${message}`;
  };

  // Show verification warning for unverified sellers
  const showVerificationWarning = verificationStatus === 'blocked' || 
    (verificationStatus === 'pending' && !isVerified);

  if (showVerificationWarning) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              {verificationStatus === 'blocked' ? 'Продавец заблокирован' : 'Продавец не подтвержден'}
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              {verificationStatus === 'blocked' 
                ? 'Данный продавец заблокирован администрацией. Свяжитесь с поддержкой для получения информации.'
                : 'Продавец еще не прошел верификацию. Будьте осторожны при совершении сделок.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Phone Section */}
      {sellerPhone && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Телефон:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPhone(!showPhone)}
              className="text-xs"
            >
              {showPhone ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Скрыть
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Показать
                </>
              )}
            </Button>
          </div>
          
          {showPhone && (
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="font-mono text-sm">{formatPhone(sellerPhone)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleContactAction(handleCopyPhone)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleContactAction(() => window.open(`tel:${sellerPhone}`))}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Позвонить
                </Button>
                
                <Button
                  onClick={() => handleContactAction(() => window.open(getWhatsAppUrl(sellerPhone), '_blank'))}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Telegram Section */}
      {sellerTelegram && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Telegram:</span>
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <span className="font-mono text-sm">{formatTelegram(sellerTelegram)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleContactAction(handleCopyTelegram)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={() => handleContactAction(() => window.open(getTelegramUrl(sellerTelegram), '_blank'))}
            className="w-full bg-blue-500 hover:bg-blue-600"
            size="sm"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Написать в Telegram
          </Button>
        </div>
      )}

      {/* Contact Info */}
      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
        <p>💡 <strong>Совет:</strong> При обращении к продавцу укажите название товара для быстрой идентификации</p>
      </div>

      {/* Auth Dialog */}
      <AuthDialog 
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onGoToLogin={handleGoToLogin}
      />
    </div>
  );
};

export default ContactButtons;
