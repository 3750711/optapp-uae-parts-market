import React, { Suspense, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
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
        <div className="container mx-auto px-4 py-8">
          <div className={`mx-auto ${isTrustedSeller ? 'max-w-4xl' : 'max-w-lg'}`}>
            <BackButton fallback="/seller/dashboard" variant="outline" className="mb-4" />
            
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {t.sections.addProduct}
              </h1>
              <p className="text-muted-foreground">
                Заполните информацию о товаре для добавления в каталог
              </p>
              {isTrustedSeller && (
                <Badge className="mt-2 bg-emerald-50 text-emerald-600 border-emerald-200">
                  {c.trustedSeller.badge}
                </Badge>
              )}
            </div>
            
            <ErrorBoundary>
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