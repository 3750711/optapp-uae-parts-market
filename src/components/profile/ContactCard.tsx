
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  QrCode, 
  MessageCircle, 
  Phone, 
  Copy, 
  ExternalLink,
  Share2
} from 'lucide-react';
import { ProfileType } from './types';
import { toast } from '@/components/ui/use-toast';

interface ContactCardProps {
  profile: ProfileType;
}

const ContactCard: React.FC<ContactCardProps> = ({ profile }) => {
  const [qrCodeOpen, setQrCodeOpen] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Скопировано!',
      description: `${label} скопирован в буфер обмена`,
    });
  };

  const generateVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.full_name || 'Пользователь'}
ORG:${profile.company_name || ''}
TEL:${profile.phone || ''}
URL:${profile.telegram ? `https://t.me/${profile.telegram.replace('@', '')}` : ''}
NOTE:OPT ID: ${profile.opt_id || 'Не указан'}
END:VCARD`;
    return vcard;
  };

  const shareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Профиль ${profile.full_name}`,
          text: `Посмотрите профиль ${profile.full_name} на OptCargo`,
          url: profileUrl
        });
      } catch (error) {
        copyToClipboard(profileUrl, 'Ссылка на профиль');
      }
    } else {
      copyToClipboard(profileUrl, 'Ссылка на профиль');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white to-indigo-50 border shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-optapp-yellow" />
          <CardTitle className="text-lg font-semibold">Контакты и связь</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-3">
          {profile.phone && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{profile.phone}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(profile.phone!, 'Телефон')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}

          {profile.telegram && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{profile.telegram}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`https://t.me/${profile.telegram!.replace('@', '')}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(profile.telegram!, 'Telegram')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {profile.opt_id && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  OPT ID
                </Badge>
                <span className="text-sm font-medium">{profile.opt_id}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(profile.opt_id!, 'OPT ID')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Dialog open={qrCodeOpen} onOpenChange={setQrCodeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR-код
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>QR-код профиля</DialogTitle>
                <DialogDescription>
                  Покажите этот QR-код для быстрого обмена контактами
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center p-6">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-sm text-center">
                      QR-код будет здесь<br/>
                      (требует интеграции)
                    </span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={shareProfile} className="w-full flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Поделиться
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactCard;
