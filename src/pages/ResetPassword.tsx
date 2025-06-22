
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Автоматически перенаправляем через 3 секунды
    const timer = setTimeout(() => {
      navigate('/forgot-password', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleRedirect = () => {
    navigate('/forgot-password', { replace: true });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Система сброса пароля обновлена</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Мы обновили систему сброса пароля. Теперь все операции по сбросу пароля 
              выполняются через страницу "Забыли пароль".
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Что изменилось:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 text-left">
                <li>• Единая система с кодами подтверждения</li>
                <li>• Улучшенная безопасность</li>
                <li>• Поддержка OPT ID и email</li>
                <li>• Защита от спама</li>
              </ul>
            </div>
            
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Вы будете перенаправлены автоматически через несколько секунд...
              </p>
              
              <Button 
                onClick={handleRedirect}
                className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
              >
                Перейти к сбросу пароля
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ResetPassword;
