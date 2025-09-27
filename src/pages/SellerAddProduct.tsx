import React, { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import { useLanguage } from "@/hooks/useLanguage";
import { getFormTranslations } from "@/utils/translations/forms";
import { getCommonTranslations } from "@/utils/translations/common";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

// Lazy loading для оптимизации
const StandardSellerForm = React.lazy(() => import("@/components/seller/StandardSellerForm"));
const TrustedSellerForm = React.lazy(() => import("@/components/seller/TrustedSellerForm"));

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Ошибка загрузки формы</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Не удалось загрузить форму добавления товара
            </p>
          </div>
          <div className="space-y-2">
            <Button onClick={resetErrorBoundary} className="w-full">
              Попробовать снова
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Обновить страницу
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Simple Error Boundary
class LazyLoadErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyLoad Error:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return this.props.children;
  }
}

const SellerAddProduct = () => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const t = getFormTranslations(language);
  const c = getCommonTranslations(language);
  
  // Определяем тип формы на основе статуса доверенного продавца
  const isTrustedSeller = profile?.is_trusted_seller === true;

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
            
            <LazyLoadErrorBoundary fallback={ErrorFallback}>
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
            </LazyLoadErrorBoundary>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default SellerAddProduct;