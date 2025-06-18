import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SubmissionState {
  isLoading: boolean;
  stage: string;
  progress: number;
  createdOrder: any;
  error: string | null;
  retryCount: number;
  lastOperation: (() => Promise<void>) | null;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

import { useOptimizedOrderSubmission } from './useOptimizedOrderSubmission';

export const useAdminOrderSubmission = () => {
  return useOptimizedOrderSubmission();
};
