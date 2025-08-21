import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, Phone } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';

const BlockedPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <Layout>
      <Helmet>
        <title>Аккаунт заблокирован - OptApp</title>
        <meta name="description" content="Ваш аккаунт временно заблокирован. Свяжитесь с поддержкой для получения дополнительной информации." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Аккаунт заблокирован
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <div className="space-y-3">
              <p className="text-muted-foreground">
                Ваш аккаунт временно заблокирован администратором системы.
              </p>
              <p className="text-sm text-muted-foreground">
                Это могло произойти из-за нарушения правил платформы или по соображениям безопасности.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h3 className="font-semibold text-sm">Для разблокировки свяжитесь с поддержкой:</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href="mailto:support@optapp.com" 
                    className="text-primary hover:underline"
                  >
                    support@optapp.com
                  </a>
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href="tel:+971501234567" 
                    className="text-primary hover:underline"
                  >
                    +971 50 123 4567
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                При обращении укажите ваш OPT ID и опишите ситуацию
              </p>
            </div>

            <Button 
              onClick={handleGoHome}
              variant="outline" 
              className="w-full"
            >
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BlockedPage;