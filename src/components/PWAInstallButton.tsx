import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Check } from 'lucide-react';
import { useA2HS } from '@/hooks/useA2HS';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'default',
  size = 'default',
  showIcon = true,
  className = ''
}) => {
  const { installable, isInstalled, install } = useA2HS();
  const [isInstalling, setIsInstalling] = useState(false);
  const { language } = useLanguage();

  const t = language === 'en' ? {
    install: 'Install App',
    installing: 'Installing...',
    installed: 'App Installed',
    installSuccess: 'App installed successfully',
    installFailed: 'Failed to install app',
    installCancelled: 'Installation cancelled'
  } : language === 'bn' ? {
    install: 'অ্যাপ ইনস্টল করুন',
    installing: 'ইনস্টল হচ্ছে...',
    installed: 'অ্যাপ ইনস্টল হয়েছে',
    installSuccess: 'অ্যাপ সফলভাবে ইনস্টল হয়েছে',
    installFailed: 'অ্যাপ ইনস্টল করতে ব্যর্থ',
    installCancelled: 'ইনস্টলেশন বাতিল'
  } : {
    install: 'Установить приложение',
    installing: 'Установка...',
    installed: 'Приложение установлено',
    installSuccess: 'Приложение успешно установлено',
    installFailed: 'Не удалось установить приложение',
    installCancelled: 'Установка отменена'
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await install();
      
      if (success) {
        toast({
          title: t.installSuccess,
          description: language === 'en' 
            ? 'You can now use the app from your home screen'
            : language === 'bn'
            ? 'এখন আপনি আপনার হোম স্ক্রিন থেকে অ্যাপটি ব্যবহার করতে পারেন'
            : 'Теперь вы можете использовать приложение с главного экрана'
        });
      } else {
        toast({
          title: t.installCancelled,
          description: language === 'en'
            ? 'You can install the app later from the browser menu'
            : language === 'bn'
            ? 'আপনি পরে ব্রাউজার মেনু থেকে অ্যাপটি ইনস্টল করতে পারেন'
            : 'Вы можете установить приложение позже через меню браузера',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('PWA Install error:', error);
      toast({
        title: t.installFailed,
        description: language === 'en'
          ? 'Please try again or install from browser menu'
          : language === 'bn'
          ? 'অনুগ্রহ করে আবার চেষ্টা করুন বা ব্রাউজার মেনু থেকে ইনস্টল করুন'
          : 'Попробуйте еще раз или установите через меню браузера',
        variant: 'destructive'
      });
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't render if not installable and not installed
  if (!installable && !isInstalled) {
    return null;
  }

  // Show installed state
  if (isInstalled) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={`${className} text-green-600 border-green-200 bg-green-50`}
      >
        {showIcon && <Check className="mr-2 h-4 w-4" />}
        {t.installed}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstall}
      disabled={isInstalling}
      className={className}
    >
      {showIcon && (
        isInstalling 
          ? <Download className="mr-2 h-4 w-4 animate-bounce" />
          : <Smartphone className="mr-2 h-4 w-4" />
      )}
      {isInstalling ? t.installing : t.install}
    </Button>
  );
};