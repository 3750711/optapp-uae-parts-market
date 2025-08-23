
import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { getSellerListingsPageTranslations } from "@/utils/translations/sellerListingsPage";

interface Props {
  children: ReactNode;
  language?: 'ru' | 'en' | 'bn';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class SellerListingsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SellerListings Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const language = this.props.language || 'ru';
      const t = getSellerListingsPageTranslations(language);
      
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">{t.errorBoundary.title}</h1>
            
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <div className="font-medium mb-1">{t.errorBoundary.errorOccurred}</div>
                  <div className="text-sm">
                    {this.state.error?.message || t.errorBoundary.unknownError}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={this.handleRetry}
                  className="ml-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t.errorBoundary.refreshPage}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SellerListingsErrorBoundary;
