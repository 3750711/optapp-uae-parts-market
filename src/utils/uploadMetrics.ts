// Upload performance metrics and monitoring
export interface UploadMetric {
  fileName: string;
  duration: number;
  success: boolean;
  method: string;
  timestamp: number;
  network?: string;
  fileSize?: number;
  error?: string;
}

class UploadMetrics {
  private readonly maxHistorySize = 100;
  
  start(fileName: string) {
    performance.mark(`upload-start-${fileName}`);
    console.log('📊 Started tracking upload:', fileName);
  }
  
  end(
    fileName: string, 
    success: boolean, 
    method: string, 
    fileSize?: number,
    error?: string
  ) {
    try {
      performance.mark(`upload-end-${fileName}`);
      performance.measure(
        `upload-${fileName}`,
        `upload-start-${fileName}`,
        `upload-end-${fileName}`
      );
      
      const measure = performance.getEntriesByName(`upload-${fileName}`)[0];
      
      const metric: UploadMetric = {
        fileName,
        duration: measure ? measure.duration : 0,
        success,
        method,
        timestamp: Date.now(),
        network: (navigator as any).connection?.effectiveType || 'unknown',
        fileSize,
        error
      };
      
      this.saveMetric(metric);
      
      console.log('📊 Upload metric recorded:', {
        fileName,
        success,
        duration: `${Math.round(metric.duration)}ms`,
        method,
        network: metric.network
      });
      
      // Clean up performance marks
      performance.clearMarks(`upload-start-${fileName}`);
      performance.clearMarks(`upload-end-${fileName}`);
      performance.clearMeasures(`upload-${fileName}`);
      
    } catch (error) {
      console.warn('Failed to record upload metric:', error);
    }
  }
  
  private saveMetric(metric: UploadMetric) {
    try {
      const history = this.getHistory();
      history.push(metric);
      
      // Keep only the latest entries
      if (history.length > this.maxHistorySize) {
        history.splice(0, history.length - this.maxHistorySize);
      }
      
      localStorage.setItem('upload_metrics', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save upload metric:', error);
    }
  }
  
  private getHistory(): UploadMetric[] {
    try {
      const saved = localStorage.getItem('upload_metrics');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load upload metrics history:', error);
      return [];
    }
  }
  
  getSuccessRate(timeWindowHours = 24): string | null {
    const history = this.getHistory();
    if (history.length === 0) return null;
    
    const cutoff = Date.now() - (timeWindowHours * 60 * 60 * 1000);
    const recentMetrics = history.filter(m => m.timestamp >= cutoff);
    
    if (recentMetrics.length === 0) return null;
    
    const successful = recentMetrics.filter(m => m.success).length;
    return ((successful / recentMetrics.length) * 100).toFixed(1);
  }
  
  getAverageUploadTime(timeWindowHours = 24): number | null {
    const history = this.getHistory();
    if (history.length === 0) return null;
    
    const cutoff = Date.now() - (timeWindowHours * 60 * 60 * 1000);
    const recentSuccessful = history.filter(m => 
      m.timestamp >= cutoff && m.success && m.duration > 0
    );
    
    if (recentSuccessful.length === 0) return null;
    
    const totalDuration = recentSuccessful.reduce((sum, m) => sum + m.duration, 0);
    return Math.round(totalDuration / recentSuccessful.length);
  }
  
  getMethodsBreakdown(timeWindowHours = 24): Record<string, { count: number; successRate: string }> {
    const history = this.getHistory();
    const cutoff = Date.now() - (timeWindowHours * 60 * 60 * 1000);
    const recentMetrics = history.filter(m => m.timestamp >= cutoff);
    
    const breakdown: Record<string, { total: number; successful: number }> = {};
    
    recentMetrics.forEach(metric => {
      if (!breakdown[metric.method]) {
        breakdown[metric.method] = { total: 0, successful: 0 };
      }
      breakdown[metric.method].total++;
      if (metric.success) {
        breakdown[metric.method].successful++;
      }
    });
    
    const result: Record<string, { count: number; successRate: string }> = {};
    Object.keys(breakdown).forEach(method => {
      const data = breakdown[method];
      result[method] = {
        count: data.total,
        successRate: ((data.successful / data.total) * 100).toFixed(1)
      };
    });
    
    return result;
  }
  
  getDiagnosticsSummary(): {
    successRate: string | null;
    averageTime: number | null;
    methodsBreakdown: Record<string, { count: number; successRate: string }>;
    recentErrors: Array<{ fileName: string; error: string; timestamp: number }>;
  } {
    const history = this.getHistory();
    const recentErrors = history
      .filter(m => !m.success && m.error)
      .slice(-10)
      .map(m => ({
        fileName: m.fileName,
        error: m.error!,
        timestamp: m.timestamp
      }));
    
    return {
      successRate: this.getSuccessRate(),
      averageTime: this.getAverageUploadTime(),
      methodsBreakdown: this.getMethodsBreakdown(),
      recentErrors
    };
  }
  
  clearHistory() {
    localStorage.removeItem('upload_metrics');
    console.log('📊 Upload metrics history cleared');
  }
}

// Export singleton instance
export const uploadMetrics = new UploadMetrics();

// Convenience function for tracking upload performance
export const trackUploadPerformance = {
  start: (fileName: string) => uploadMetrics.start(fileName),
  end: (
    fileName: string, 
    success: boolean, 
    method: string, 
    fileSize?: number,
    error?: string
  ) => uploadMetrics.end(fileName, success, method, fileSize, error)
};
