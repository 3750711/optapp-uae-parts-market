import React, { useEffect, useState } from 'react';
import { useRateLimit } from '@/hooks/useRateLimit';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RateLimitedRouteProps {
  children: React.ReactNode;
  action: string;
  limitPerHour?: number;
  windowMinutes?: number;
}

/**
 * Wrapper component that adds rate limiting to public routes
 * Uses server-side rate limiter for authenticated users
 */
export const RateLimitedRoute: React.FC<RateLimitedRouteProps> = ({
  children,
  action,
  limitPerHour = 60,
  windowMinutes = 60
}) => {
  const { checkRateLimit } = useRateLimit();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLimit = async () => {
      const allowed = await checkRateLimit(action, { limitPerHour, windowMinutes });
      setIsAllowed(allowed);
    };
    
    checkLimit();
  }, [action, limitPerHour, windowMinutes, checkRateLimit]);

  // Show loading while checking
  if (isAllowed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show rate limit exceeded message
  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Превышен лимит запросов. Пожалуйста, попробуйте позже.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
