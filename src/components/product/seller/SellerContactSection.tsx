
import React from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SellerContactSectionProps {
  user: any;
  children?: React.ReactNode;
  onShowContactInfo: () => void;
}

export const SellerContactSection: React.FC<SellerContactSectionProps> = ({
  user,
  children,
  onShowContactInfo
}) => {
  const navigate = useNavigate();

  if (user) {
    return (
      <div className="space-y-4 mt-4">
        {children}
      </div>
    );
  }

  return (
    <Alert className="mt-4 border-primary/20 bg-primary/5">
      <AlertTitle className="text-primary">Требуется авторизация</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>Для связи с продавцом необходимо авторизоваться</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onShowContactInfo}>
            Войти для связи с продавцом
          </Button>
          <Button variant="outline" onClick={() => navigate('/register')}>
            Регистрация
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
