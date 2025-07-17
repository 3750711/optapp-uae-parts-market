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
      const { data, error } = await supabase.functions.invoke('send-bulk-telegram-messages', {
        body: {
          recipients: params.recipients,
          messageText: params.messageText,
          images: params.images || []
        }
      });

      if (error) {
        console.error('Error calling bulk message function:', error);
        throw new Error(error.message || 'Failed to send bulk messages');
      }

      setProgress(100);
      return data;

    } catch (error) {
      console.error('Error in bulk messaging:', error);
      throw error;
    } finally {
      setIsLoading(false);
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return {
    sendBulkMessage,
    isLoading,
    progress
  };
};