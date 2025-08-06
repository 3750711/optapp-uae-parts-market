import { useCallback } from 'react';
import { CONTACT_CONFIG } from '@/config/contact';

interface AnalyticsData {
  productId?: string;
  sellerId?: string;
  contactType?: 'telegram' | 'whatsapp' | 'manager';
  communicationRating?: number | null;
  lotNumber?: number | null;
}

export const useContactAnalytics = () => {
  const trackEvent = useCallback((eventName: string, data: AnalyticsData) => {
    try {
      // Log for development
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Contact Analytics:', eventName, data);
      }

      // Here you can integrate with analytics services like:
      // - Google Analytics
      // - Mixpanel
      // - Custom analytics service
      
      // Example for Google Analytics (gtag)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, {
          custom_parameter_1: data.productId,
          custom_parameter_2: data.sellerId,
          custom_parameter_3: data.contactType,
          custom_parameter_4: data.communicationRating,
        });
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, []);

  const trackDialogOpened = useCallback((data: AnalyticsData) => {
    trackEvent(CONTACT_CONFIG.ANALYTICS_EVENTS.DIALOG_OPENED, data);
  }, [trackEvent]);

  const trackManagerContact = useCallback((data: AnalyticsData) => {
    trackEvent(CONTACT_CONFIG.ANALYTICS_EVENTS.MANAGER_CONTACT, {
      ...data,
      contactType: 'manager',
    });
  }, [trackEvent]);

  const trackDirectContact = useCallback((data: AnalyticsData) => {
    trackEvent(CONTACT_CONFIG.ANALYTICS_EVENTS.DIRECT_CONTACT, data);
  }, [trackEvent]);

  const trackDialogCancelled = useCallback((data: AnalyticsData) => {
    trackEvent(CONTACT_CONFIG.ANALYTICS_EVENTS.DIALOG_CANCELLED, data);
  }, [trackEvent]);

  return {
    trackDialogOpened,
    trackManagerContact,
    trackDirectContact,
    trackDialogCancelled,
  };
};