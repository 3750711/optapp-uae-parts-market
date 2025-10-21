import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BulkMessageParams {
  recipients: string[] | string; // Array of user IDs or predefined group name
  messageText: string;
  images?: string[];
}

interface BulkMessageResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{
    userId: string;
    userName?: string;
    error: string;
  }>;
}

export const useBulkMessaging = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const sendBulkMessage = async (params: BulkMessageParams): Promise<BulkMessageResult> => {
    setIsLoading(true);
    setProgress(0);

    try {
      console.log('📮 [BulkMessaging] Queueing bulk message via QStash');
      
      const { data, error } = await supabase.functions.invoke('trigger-upstash-notification', {
        body: {
          notificationType: 'bulk',
          payload: {
            recipients: params.recipients,
            messageText: params.messageText,
            images: params.images || []
          }
        }
      });

      if (error) {
        console.error('❌ [BulkMessaging] Failed to queue bulk message:', error);
        throw new Error(error.message || 'Failed to queue bulk messages');
      }

      console.log('✅ [BulkMessaging] Bulk message queued successfully');
      setProgress(100);
      
      // Return success result - actual sending happens in background
      return {
        total: Array.isArray(params.recipients) ? params.recipients.length : 0,
        sent: 0,
        failed: 0,
        errors: []
      };

    } catch (error) {
      console.error('💥 [BulkMessaging] Exception:', error);
      throw error;
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return {
    sendBulkMessage,
    isLoading,
    progress
  };
};