import React, { Suspense, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import BackButton from "@/components/navigation/BackButton";

// Lazy loading для оптимизации
const StandardSellerForm = React.lazy(() => import("@/components/seller/StandardSellerForm"));
const TrustedSellerForm = React.lazy(() => import("@/components/seller/TrustedSellerForm"));

const SellerAddProduct = () => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const t = getFormTranslations(language);
  const c = getCommonTranslations(language);
  
  // Предзагрузка Cloudinary Widget для мгновенного открытия
  useEffect(() => {
    const cloudinaryScriptUrl = 'https://upload-widget.cloudinary.com/global/all.js';
    const existingScript = document.querySelector(`link[rel="preload"][href="${cloudinaryScriptUrl}"]`);
    
    if (!existingScript) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = cloudinaryScriptUrl;
      link.as = 'script';
      document.head.appendChild(link);
    }
  }, []);
  
  // Определяем тип формы на основе статуса доверенного продавца
  const isTrustedSeller = profile?.is_trusted_seller === true;

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <Layout>
        <div className="container mx-auto px-4 md:px-8 py-6 md:py-8">
          <div className={`mx-auto ${isTrustedSeller ? 'max-w-4xl' : 'max-w-lg'}`}>
            <BackButton fallback="/seller/dashboard" variant="outline" className="mb-4" />
            
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {t.sections.addProduct}
              </h1>
              <p className="text-muted-foreground">
                {t.sections.addProductDescription}
              </p>
              {isTrustedSeller && (
                <Badge className="mt-2 bg-emerald-50 text-emerald-600 border-emerald-200">
                  {c.trustedSeller.badge}
                </Badge>
              )}
            </div>
            
            <ErrorBoundary
              fallback={
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Не удалось загрузить форму
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          Попробуйте обновить страницу
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Button onClick={() => window.location.reload()} className="w-full">
                          Обновить страницу
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => window.history.back()} 
                          className="w-full"
                        >
                          Назад
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <Suspense fallback={
                <Card>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t.messages.loadingForm}</span>
                    </div>
                  </CardContent>
                </Card>
              }>
                {isTrustedSeller ? (
                  <TrustedSellerForm mode="trusted_seller" />
                ) : (
                  <StandardSellerForm />
                )}
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default SellerAddProduct;