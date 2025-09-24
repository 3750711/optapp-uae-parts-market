// Enhanced error recovery and logging system
export interface UploadError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  context?: {
    fileName?: string;
    fileSize?: number;
    attemptNumber?: number;
    method?: string;
  };
}

export interface RecoveryStrategy {
  name: string;
  priority: number;
  condition: (error: UploadError) => boolean;
  execute: (error: UploadError, context: any) => Promise<boolean>;
}

// Error classification system
export const classifyError = (error: any, context?: any): UploadError => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code || 'UNKNOWN_ERROR';
  
  // Network errors - high priority, recoverable
  if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch') || errorCode === 'NETWORK_ERROR') {
    return {
      code: 'NETWORK_ERROR',
      message: errorMessage,
      severity: 'high',
      recoverable: true,
      context
    };
  }
  
  // Authentication errors - critical, needs user intervention
  if (errorMessage.includes('Authentication') || errorMessage.includes('401') || errorCode === 'AUTH_ERROR') {
    return {
      code: 'AUTH_ERROR',
      message: errorMessage,
      severity: 'critical',
      recoverable: false,
      context
    };
  }
  
  // Rate limiting - medium priority, temporary
  if (errorMessage.includes('rate limit') || errorMessage.includes('429') || errorCode === 'RATE_LIMITED') {
    return {
      code: 'RATE_LIMITED',
      message: errorMessage,
      severity: 'medium',
      recoverable: true,
      context
    };
  }
  
  // File size/format errors - low priority, not recoverable for current file
  if (errorMessage.includes('file size') || errorMessage.includes('format') || errorCode === 'FILE_INVALID') {
    return {
      code: 'FILE_INVALID',
      message: errorMessage,
      severity: 'low',
      recoverable: false,
      context
    };
  }
  
  // Worker errors - medium priority, recoverable with fallback
  if (errorMessage.includes('Worker') || errorCode.includes('WORKER')) {
    return {
      code: 'WORKER_ERROR',
      message: errorMessage,
      severity: 'medium',
      recoverable: true,
      context
    };
  }
  
  // Compression errors - medium priority, recoverable by skipping compression
  if (errorMessage.includes('compression') || errorCode.includes('COMPRESSION')) {
    return {
      code: 'COMPRESSION_ERROR',
      message: errorMessage,
      severity: 'medium',
      recoverable: true,
      context
    };
  }
  
  // Abort errors - low priority, user initiated
  if (errorMessage.includes('AbortError') || errorMessage.includes('cancelled') || errorCode === 'ABORTED') {
    return {
      code: 'UPLOAD_ABORTED',
      message: errorMessage,
      severity: 'low',
      recoverable: false,
      context
    };
  }
  
  // Default to medium severity, potentially recoverable
  return {
    code: errorCode,
    message: errorMessage,
    severity: 'medium',
    recoverable: true,
    context
  };
};

// Recovery strategies
export const recoveryStrategies: RecoveryStrategy[] = [
  // Strategy 1: Retry network errors with exponential backoff
  {
    name: 'network-retry',
    priority: 1,
    condition: (error) => error.code === 'NETWORK_ERROR' && error.recoverable,
    execute: async (error, context) => {
      const attempt = context.attemptNumber || 0;
      if (attempt >= 3) return false;
      
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
      console.log(`🔄 Network retry strategy: waiting ${delay}ms before attempt ${attempt + 1}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return true;
    }
  },
  
  // Strategy 2: Handle rate limiting with smart backoff
  {
    name: 'rate-limit-backoff',
    priority: 2,
    condition: (error) => error.code === 'RATE_LIMITED',
    execute: async (error, context) => {
      const baseDelay = 60000; // 1 minute base delay for rate limiting
      const jitter = Math.random() * 30000; // Add up to 30s jitter
      const delay = baseDelay + jitter;
      
      console.log(`⏱️ Rate limit recovery: waiting ${Math.round(delay/1000)}s`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return true;
    }
  },
  
  // Strategy 3: Fallback for worker errors
  {
    name: 'worker-fallback',
    priority: 3,
    condition: (error) => error.code === 'WORKER_ERROR',
    execute: async (error, context) => {
      console.log('🔧 Worker error recovery: switching to direct upload without compression');
      if (context.setCompressionEnabled) {
        context.setCompressionEnabled(false);
      }
      return true;
    }
  },
  
  // Strategy 4: Compression fallback
  {
    name: 'compression-fallback',
    priority: 4,
    condition: (error) => error.code === 'COMPRESSION_ERROR',
    execute: async (error, context) => {
      console.log('📄 Compression error recovery: uploading original file');
      return true; // Let the main upload continue with original file
    }
  }
];

// Enhanced error recovery manager
export class ErrorRecoveryManager {
  private errorHistory: Map<string, UploadError[]> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();
  
  // Record error for analysis
  recordError(fileId: string, error: any, context?: any): UploadError {
    const uploadError = classifyError(error, context);
    
    if (!this.errorHistory.has(fileId)) {
      this.errorHistory.set(fileId, []);
    }
    
    this.errorHistory.get(fileId)!.push(uploadError);
    
    // Log structured error
    console.error('📊 Error recorded:', {
      fileId,
      code: uploadError.code,
      severity: uploadError.severity,
      recoverable: uploadError.recoverable,
      context: uploadError.context
    });
    
    return uploadError;
  }
  
  // Attempt recovery using appropriate strategy
  async attemptRecovery(fileId: string, uploadError: UploadError, context: any): Promise<boolean> {
    const attempts = this.recoveryAttempts.get(fileId) || 0;
    
    // Don't attempt recovery for non-recoverable errors
    if (!uploadError.recoverable) {
      console.log(`❌ Error not recoverable: ${uploadError.code}`);
      return false;
    }
    
    // Limit total recovery attempts per file
    if (attempts >= 5) {
      console.log(`🛑 Max recovery attempts reached for file: ${fileId}`);
      return false;
    }
    
    // Find appropriate recovery strategy
    const strategy = recoveryStrategies
      .filter(s => s.condition(uploadError))
      .sort((a, b) => a.priority - b.priority)[0];
    
    if (!strategy) {
      console.log(`❓ No recovery strategy found for error: ${uploadError.code}`);
      return false;
    }
    
    try {
      this.recoveryAttempts.set(fileId, attempts + 1);
      
      console.log(`🚑 Attempting recovery with strategy: ${strategy.name}`);
      const success = await strategy.execute(uploadError, context);
      
      if (success) {
        console.log(`✅ Recovery successful with strategy: ${strategy.name}`);
      } else {
        console.log(`❌ Recovery failed with strategy: ${strategy.name}`);
      }
      
      return success;
    } catch (recoveryError) {
      console.error('❌ Recovery strategy failed:', recoveryError);
      return false;
    }
  }
  
  // Get error statistics for debugging
  getErrorStats(fileId?: string): any {
    if (fileId) {
      const errors = this.errorHistory.get(fileId) || [];
      return {
        fileId,
        totalErrors: errors.length,
        recoveryAttempts: this.recoveryAttempts.get(fileId) || 0,
        errorCodes: [...new Set(errors.map(e => e.code))],
        severityDistribution: errors.reduce((acc, e) => {
          acc[e.severity] = (acc[e.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    } else {
      // Global stats
      const allErrors = Array.from(this.errorHistory.values()).flat();
      return {
        totalFiles: this.errorHistory.size,
        totalErrors: allErrors.length,
        totalRecoveryAttempts: Array.from(this.recoveryAttempts.values()).reduce((a, b) => a + b, 0),
        mostCommonErrors: allErrors.reduce((acc, e) => {
          acc[e.code] = (acc[e.code] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    }
  }
  
  // Clear history for a file (on successful upload)
  clearFileHistory(fileId: string): void {
    this.errorHistory.delete(fileId);
    this.recoveryAttempts.delete(fileId);
  }
  
  // Reset all history
  reset(): void {
    this.errorHistory.clear();
    this.recoveryAttempts.clear();
  }
}