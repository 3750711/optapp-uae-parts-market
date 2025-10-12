import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';

const PublicSellerProfileRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirectToPublicProfile = async () => {
      if (!id) {
        setError('ID продавца не найден в URL');
        setIsLoading(false);
        return;
      }

      try {
        // Проверяем, существует ли продавец
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_type')
          .eq('id', id)
          .eq('user_type', 'seller')
          .maybeSingle();

        if (profileError) {
          console.error('Ошибка при получении профиля:', profileError);
          setError('Ошибка при получении профиля продавца');
          setIsLoading(false);
          return;
        }

        if (!profile) {
          setError('Продавец не найден');
          setIsLoading(false);
          return;
        }

        // Редиректим на новый публичный профиль (без токена)
        navigate(`/public-profile/${id}`, { replace: true });

      } catch (err) {
        console.error('Неожиданная ошибка:', err);
        setError('Произошла неожиданная ошибка');
        setIsLoading(false);
      }
    };

    redirectToPublicProfile();
  }, [id, navigate]);

  const handleGoBack = () => {
    try {
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Ошибка навигации:", error);
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Перенаправление к профилю продавца</h2>
              <p className="text-muted-foreground">Подготавливаем публичную ссылку...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Назад
            </Button>
          </div>
          
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-destructive">Профиль продавца недоступен</h2>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Button 
                variant="default" 
                onClick={() => navigate('/')}
              >
                Вернуться на главную
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/stores')}
              >
                Перейти к магазинам
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
};

export default PublicSellerProfileRedirect;