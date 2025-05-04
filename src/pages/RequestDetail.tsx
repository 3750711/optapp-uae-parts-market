
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Tag, FileText, Check, MessageSquare, Send, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressSteps } from '@/components/request/ProgressSteps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

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

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isNewRequest, setIsNewRequest] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [contactType, setContactType] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showResponseOptions, setShowResponseOptions] = useState(false);
  
  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setDataLoaded(true); // Mark data as loaded only when we actually have the data
      return data;
    },
    enabled: !!id
  });
  
  useEffect(() => {
    // Check if we just came from the create request page
    const fromCreate = sessionStorage.getItem('fromRequestCreate');
    if (fromCreate === 'true' && id) {
      // Clear the flag so a refresh won't show the processing screen again
      sessionStorage.removeItem('fromRequestCreate');
      setIsNewRequest(true);
    }
  }, [id]);

  const handleProcessingComplete = () => {
    // Only set processing complete if the data is loaded
    if (dataLoaded) {
      setProcessingComplete(true);
      // After processing is complete, we'll show response options after a short delay
      setTimeout(() => {
        setShowResponseOptions(true);
      }, 1000);
    }
  };

  const handleContactSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Here we would save the contact information to the database
      // For now we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Контактная информация сохранена",
        description: "Мы свяжемся с вами, как только найдем подходящие варианты.",
      });

      // Redirect to requests list after successful submission
      navigate('/requests');
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'processing': return 'secondary';
      case 'completed': return 'success';
      default: return 'outline';
    }
  };

  if (isLoading || !dataLoaded) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Запрос не найден</CardTitle>
              <CardDescription>Запрашиваемая информация не существует или была удалена</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {isNewRequest ? (
          <div className="space-y-8">
            <Card className="border shadow-lg animate-fade-in overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Обработка запроса #{id}</CardTitle>
                <CardDescription>
                  {processingComplete 
                    ? "Ваш запрос успешно отправлен и обработан!"
                    : "Мы обрабатываем ваш запрос на запчасть"
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ProgressSteps 
                  steps={PROCESSING_STEPS} 
                  stepDuration={STEP_DURATION}
                  onComplete={handleProcessingComplete}
                />
                
                {processingComplete && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col items-center justify-center py-6">
                      <div className="rounded-full bg-green-100 p-3 mb-4">
                        <Check className="h-10 w-10 text-green-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-center mb-2">Ваш запрос отправлен!</h2>
                      <p className="text-muted-foreground text-center max-w-md">
                        Еще чуть-чуть и вы начнете получать предложения. Пожалуйста, оставьте контактную информацию, чтобы мы могли отправить вам лучшие варианты.
                      </p>
                    </div>
                    
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
                  </div>
                )}
              </CardContent>
              
              {processingComplete && (
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
            
            {showResponseOptions && (
              <Card className="border shadow-lg animate-fade-in overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl flex items-center">
                    <Sparkles className="mr-3 h-5 w-5 text-amber-500" />
                    Предложения по запросу
                  </CardTitle>
                  <CardDescription>
                    Мы находим для вас лучшие предложения по запрошенной запчасти
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* This section will be populated with response options in future updates */}
                  <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">
                      Ожидайте предложения от продавцов в ближайшее время
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{request.title}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarClock className="w-4 h-4 mr-2" />
                    {new Date(request.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(request.status)}>
                  {request.status === 'pending' && 'В ожидании'}
                  {request.status === 'processing' && 'В обработке'}
                  {request.status === 'completed' && 'Завершен'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {(request.brand || request.model) && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">
                    {request.brand} {request.model && `${request.model}`}
                  </span>
                </div>
              )}
              
              {request.vin && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">VIN: {request.vin}</span>
                </div>
              )}
              
              {request.description && (
                <div className="mt-4">
                  <h3 className="font-medium mb-1">Дополнительная информация:</h3>
                  <div className="whitespace-pre-wrap">{request.description}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RequestDetail;
