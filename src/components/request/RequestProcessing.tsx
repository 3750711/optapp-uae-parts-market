
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from './ProgressSteps';
import { Check, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const STEP_DURATION = 15000; // 15 seconds per step

const PROCESSING_STEPS = [
  {
    title: 'Отправляем запрос в 100+ магазинов ОАЭ',
    description: 'Ваш запрос обрабатывается и направляется во все подходящие магазины',
  },
  {
    title: 'Передаем данные опытным подборщикам',
    description: 'Специалисты анализируют информацию для поиска оптимальных вариантов',
  },
  {
    title: 'Ищем магазины где такая запчасть может быть в наличии',
    description: 'Сканируем базы данных магазинов для проверки наличия деталей',
  },
  {
    title: 'Передаем запрос нашим специалистам для расширенного поиска',
    description: 'Эксперты проводят дополнительный анализ для поиска лучших вариантов',
  },
];

interface RequestProcessingProps {
  requestId: string;
  requestTitle: string;
}

const RequestProcessing: React.FC<RequestProcessingProps> = ({ 
  requestId, 
  requestTitle 
}) => {
  const [processingComplete, setProcessingComplete] = useState(false);
  const [contactType, setContactType] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Check if this animation has already been shown for this request
  useEffect(() => {
    const checkAnimationStatus = async () => {
      try {
        // Use localStorage to track if animation has run for this specific request
        const animationKey = `request_${requestId}_animation_shown`;
        const animationShown = localStorage.getItem(animationKey);
        
        if (animationShown) {
          // Animation already shown before, skip to completed state
          setProcessingComplete(true);
          setHasRun(true);
        } else {
          // First time viewing, show animation
          setHasRun(false);
        }
      } catch (error) {
        console.error("Error checking animation status:", error);
        // Default to showing completed state if there's an error
        setProcessingComplete(true);
      }
    };
    
    checkAnimationStatus();
  }, [requestId]);
  
  // Initialize contact info from profile if available
  useEffect(() => {
    if (profile) {
      if (profile.telegram) {
        setContactType('telegram');
        setContactInfo(profile.telegram);
      } else if (profile.phone) {
        setContactType('whatsapp');
        setContactInfo(profile.phone);
      }
    }
  }, [profile]);

  const handleProcessingComplete = () => {
    setProcessingComplete(true);
    
    // Mark this request's animation as shown
    try {
      const animationKey = `request_${requestId}_animation_shown`;
      localStorage.setItem(animationKey, 'true');
      setHasRun(true);
    } catch (error) {
      console.error("Error saving animation status:", error);
    }
  };

  const handleContactSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Save the contact information
      let updateData = {};
      if (contactType === 'whatsapp') {
        updateData = { phone: contactInfo };
      } else {
        updateData = { telegram: contactInfo };
      }
      
      if (user) {
        // If user is authenticated, update their profile
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);
        
        if (error) throw error;
      }
      
      // Also save contact info specifically for this request
      const { error: requestError } = await supabase
        .from('requests')
        .update({
          [contactType === 'whatsapp' ? 'phone' : 'telegram']: contactInfo
        })
        .eq('id', requestId);
      
      if (requestError) throw requestError;
      
      toast({
        title: "Контактная информация сохранена",
        description: "Мы свяжемся с вами, как только найдем подходящие варианты.",
      });
      
      // No redirect, stay on the page
    } catch (error) {
      console.error("Error saving contact information:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить контактную информацию. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border shadow-lg animate-fade-in overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Обработка запроса #{requestId}</CardTitle>
        <CardDescription>
          {processingComplete 
            ? "Ваш запрос успешно отправлен и обработан!"
            : "Мы обрабатываем ваш запрос на запчасть"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!processingComplete ? (
          <ProgressSteps 
            steps={PROCESSING_STEPS} 
            stepDuration={STEP_DURATION}
            onComplete={handleProcessingComplete}
          />
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Ваш запрос отправлен!</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Еще чуть-чуть и вы начнете получать предложения. 
                {!user && "Пожалуйста, оставьте контактную информацию, чтобы мы могли отправить вам лучшие варианты."}
              </p>
            </div>
            
            {/* Only show contact form if user is not authenticated */}
            {!user && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant={contactType === 'whatsapp' ? "default" : "outline"} 
                    className="flex-1"
                    onClick={() => setContactType('whatsapp')}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button 
                    variant={contactType === 'telegram' ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setContactType('telegram')}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Telegram
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="contactInfo" className="text-sm font-medium">
                    {contactType === 'whatsapp' ? 'Номер WhatsApp' : 'Имя пользователя Telegram'}
                  </label>
                  <Input 
                    id="contactInfo"
                    placeholder={contactType === 'whatsapp' ? '+971 50 123 4567' : '@username'}
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Мы используем эту информацию только для отправки вам предложений по запрошенной запчасти.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {processingComplete && !user && (
        <CardFooter>
          <Button 
            onClick={handleContactSubmit} 
            disabled={!contactInfo || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Сохранение..." : "Сохранить контакты"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default RequestProcessing;
