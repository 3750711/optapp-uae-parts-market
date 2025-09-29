import React, { Suspense, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { preWarm } from "@/workers/uploadWorker.singleton";

// Lazy loading для оптимизации
const StandardSellerForm = React.lazy(() => import("@/components/seller/StandardSellerForm"));
const TrustedSellerForm = React.lazy(() => import("@/components/seller/TrustedSellerForm"));

const SellerAddProduct = () => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const t = getFormTranslations(language);
  const c = getCommonTranslations(language);
  
  // Определяем тип формы на основе статуса доверенного продавца
  const isTrustedSeller = profile?.is_trusted_seller === true;

  // Pre-warm worker for better upload performance
  useEffect(() => {
    let cancelled = false;
    (async () => {
      console.log('🔥 SellerAddProduct: Pre-warming worker...');
      const success = await preWarm({ retries: 3, delayMs: 400 });
      if (!cancelled) {
        console.log(success ? '✅ SellerAddProduct: Worker pre-warmed' : '⚠️ SellerAddProduct: Worker pre-warm failed');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <ProtectedRoute allowedRoles={['seller']}>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className={`mx-auto ${isTrustedSeller ? 'max-w-4xl' : 'max-w-lg'}`}>
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                {t.sections.addProduct}
                {isTrustedSeller && (
                  <span className="ml-2 text-sm font-normal text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    {c.trustedSeller.badge}
                  </span>
                )}
              </h1>
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