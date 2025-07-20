import { useState, useEffect, useRef } from 'react';
import { usePerformanceMonitor, PriceOffersPerformanceMonitor } from './use-performance-monitor';

interface ABTestConfig {
  testName: string;
  variants: {
    name: string;
    debounceTime: number;
    weight: number; // Percentage of users
  }[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}

interface ABTestResult {
  variant: string;
  userCount: number;
  avgLatency: number;
  successRate: number;
  userSatisfaction: number;
  conversionRate: number;
}

export class ABTestManager {
  private static instance: ABTestManager;
  private currentTest: ABTestConfig | null = null;
  private userVariant: string | null = null;
  private results: Map<string, ABTestResult> = new Map();
  private performanceMonitor = PriceOffersPerformanceMonitor.getInstance();

  private constructor() {
    this.loadUserVariant();
  }

  static getInstance(): ABTestManager {
    if (!ABTestManager.instance) {
      ABTestManager.instance = new ABTestManager();
    }
    return ABTestManager.instance;
  }

  // Start A/B test for debounce timing
  startDebounceTest(): void {
    const testConfig: ABTestConfig = {
      testName: 'price_offers_debounce_optimization',
      variants: [
        { name: 'control_500ms', debounceTime: 500, weight: 25 },
        { name: 'fast_300ms', debounceTime: 300, weight: 25 },
        { name: 'ultra_fast_200ms', debounceTime: 200, weight: 25 },
        { name: 'instant_100ms', debounceTime: 100, weight: 25 }
      ],
      isActive: true,
      startDate: new Date()
    };

    this.currentTest = testConfig;
    this.assignUserToVariant();
    this.saveTestConfig();
    
    console.log('🧪 A/B Test Started:', {
      testName: testConfig.testName,
      userVariant: this.userVariant,
      debounceTime: this.getCurrentDebounceTime()
    });
  }

  // Stop current A/B test
  stopCurrentTest(): ABTestResult[] {
    if (!this.currentTest) return [];

    this.currentTest.isActive = false;
    this.currentTest.endDate = new Date();
    
    const results = Array.from(this.results.values());
    
    console.log('🧪 A/B Test Completed:', {
      testName: this.currentTest.testName,
      duration: this.currentTest.endDate.getTime() - this.currentTest.startDate.getTime(),
      results: results
    });

    this.saveTestResults(results);
    return results;
  }

  // Get current debounce time based on A/B test
  getCurrentDebounceTime(): number {
    if (!this.currentTest || !this.currentTest.isActive || !this.userVariant) {
      return 500; // Default debounce time
    }

    const variant = this.currentTest.variants.find(v => v.name === this.userVariant);
    return variant?.debounceTime || 500;
  }

  // Record user interaction for A/B test
  recordInteraction(type: 'offer_created' | 'offer_updated' | 'ui_interaction', metadata?: any): void {
    if (!this.currentTest || !this.currentTest.isActive || !this.userVariant) return;

    const currentMetrics = this.performanceMonitor.getMetrics();
    
    // Update results for current variant
    const currentResult = this.results.get(this.userVariant) || {
      variant: this.userVariant,
      userCount: 0,
      avgLatency: 0,
      successRate: 0,
      userSatisfaction: 0,
      conversionRate: 0
    };

    // Update metrics based on interaction type
    switch (type) {
      case 'offer_created':
      case 'offer_updated':
        currentResult.userCount++;
        currentResult.avgLatency = currentMetrics.averageRealTimeLatency;
        currentResult.successRate = currentMetrics.successRate;
        currentResult.conversionRate = this.calculateConversionRate();
        break;
      case 'ui_interaction':
        currentResult.userSatisfaction = this.calculateUserSatisfaction(metadata);
        break;
    }

    this.results.set(this.userVariant, currentResult);
  }

  // Get current test status
  getCurrentTest(): ABTestConfig | null {
    return this.currentTest;
  }

  // Get test results
  getTestResults(): ABTestResult[] {
    return Array.from(this.results.values());
  }

  // Calculate statistical significance
  calculateSignificance(controlVariant: string, testVariant: string): {
    isSignificant: boolean;
    pValue: number;
    confidence: number;
  } {
    const control = this.results.get(controlVariant);
    const test = this.results.get(testVariant);

    if (!control || !test || control.userCount < 30 || test.userCount < 30) {
      return { isSignificant: false, pValue: 1, confidence: 0 };
    }

    // Simplified statistical significance calculation
    // In real implementation, use proper statistical libraries
    const controlRate = control.successRate / 100;
    const testRate = test.successRate / 100;
    
    const pooledRate = ((control.userCount * controlRate) + (test.userCount * testRate)) / 
                      (control.userCount + test.userCount);
    
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/control.userCount + 1/test.userCount));
    const zScore = Math.abs(testRate - controlRate) / se;
    
    // Approximate p-value calculation
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    const isSignificant = pValue < 0.05;
    const confidence = (1 - pValue) * 100;

    return { isSignificant, pValue, confidence };
  }

  // Generate A/B test report
  generateReport(): {
    testConfig: ABTestConfig | null;
    results: ABTestResult[];
    recommendations: string[];
    significance: any[];
  } {
    const results = this.getTestResults();
    const recommendations: string[] = [];
    const significance: any[] = [];

    if (results.length >= 2 && this.currentTest) {
      // Find best performing variant
      const bestVariant = results.reduce((best, current) => 
        current.successRate > best.successRate ? current : best
      );

      const controlVariant = results.find(r => r.variant.includes('control'));
      
      if (controlVariant && bestVariant.variant !== controlVariant.variant) {
        const sig = this.calculateSignificance(controlVariant.variant, bestVariant.variant);
        significance.push({
          comparison: `${controlVariant.variant} vs ${bestVariant.variant}`,
          ...sig
        });

        if (sig.isSignificant) {
          recommendations.push(
            `Рекомендуется использовать вариант "${bestVariant.variant}" ` +
            `(${this.getVariantDebounceTime(bestVariant.variant)}ms debounce) ` +
            `- показал улучшение на ${(bestVariant.successRate - controlVariant.successRate).toFixed(1)}% ` +
            `с уровнем значимости ${sig.confidence.toFixed(1)}%`
          );
        } else {
          recommendations.push(
            'Недостаточно данных для статистически значимых выводов. ' +
            'Продолжите тест или увеличьте размер выборки.'
          );
        }
      }

      // Performance recommendations
      const avgLatencies = results.map(r => r.avgLatency);
      const minLatency = Math.min(...avgLatencies);
      const fastestVariant = results.find(r => r.avgLatency === minLatency);
      
      if (fastestVariant) {
        recommendations.push(
          `Самый быстрый отклик показал вариант "${fastestVariant.variant}" ` +
          `(${fastestVariant.avgLatency.toFixed(0)}ms средняя латентность)`
        );
      }
    } else {
      recommendations.push('Недостаточно данных для анализа. Продолжите тестирование.');
    }

    return {
      testConfig: this.currentTest,
      results,
      recommendations,
      significance
    };
  }

  private assignUserToVariant(): void {
    if (!this.currentTest) return;

    const userId = this.getUserId();
    const hash = this.hashString(userId + this.currentTest.testName);
    const randomValue = hash % 100;

    let cumulativeWeight = 0;
    for (const variant of this.currentTest.variants) {
      cumulativeWeight += variant.weight;
      if (randomValue < cumulativeWeight) {
        this.userVariant = variant.name;
        break;
      }
    }

    localStorage.setItem('ab_test_variant', this.userVariant || '');
  }

  private loadUserVariant(): void {
    this.userVariant = localStorage.getItem('ab_test_variant');
  }

  private getUserId(): string {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', userId);
    }
    return userId;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private calculateConversionRate(): number {
    // Simplified conversion rate calculation
    const metrics = this.performanceMonitor.getMetrics();
    return (metrics.optimisticUpdateSuccess / Math.max(1, metrics.optimisticUpdateSuccess + metrics.optimisticUpdateFailure)) * 100;
  }

  private calculateUserSatisfaction(metadata?: any): number {
    // Simplified user satisfaction based on response times
    const metrics = this.performanceMonitor.getMetrics();
    const avgResponseTime = metrics.averageUIResponseTime;
    
    if (avgResponseTime < 100) return 95;
    if (avgResponseTime < 300) return 85;
    if (avgResponseTime < 500) return 75;
    return 60;
  }

  private getVariantDebounceTime(variantName: string): number {
    if (!this.currentTest) return 500;
    const variant = this.currentTest.variants.find(v => v.name === variantName);
    return variant?.debounceTime || 500;
  }

  private normalCDF(x: number): number {
    // Approximation of normal cumulative distribution function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private saveTestConfig(): void {
    if (this.currentTest) {
      localStorage.setItem('ab_test_config', JSON.stringify(this.currentTest));
    }
  }

  private saveTestResults(results: ABTestResult[]): void {
    const reportData = {
      timestamp: new Date().toISOString(),
      testConfig: this.currentTest,
      results: results,
      report: this.generateReport()
    };
    
    localStorage.setItem('ab_test_results', JSON.stringify(reportData));
    
    // In production, send to analytics service
    console.log('💾 A/B Test Results Saved:', reportData);
  }
}

export const useABTest = () => {
  const abTestManager = ABTestManager.getInstance();
  const [currentTest, setCurrentTest] = useState<ABTestConfig | null>(abTestManager.getCurrentTest());
  const [results, setResults] = useState<ABTestResult[]>(abTestManager.getTestResults());

  const startTest = () => {
    abTestManager.startDebounceTest();
    setCurrentTest(abTestManager.getCurrentTest());
  };

  const stopTest = () => {
    const finalResults = abTestManager.stopCurrentTest();
    setResults(finalResults);
    setCurrentTest(abTestManager.getCurrentTest());
    return finalResults;
  };

  const recordInteraction = (type: 'offer_created' | 'offer_updated' | 'ui_interaction', metadata?: any) => {
    abTestManager.recordInteraction(type, metadata);
    setResults(abTestManager.getTestResults());
  };

  const generateReport = () => {
    return abTestManager.generateReport();
  };

  const getCurrentDebounceTime = () => {
    return abTestManager.getCurrentDebounceTime();
  };

  return {
    currentTest,
    results,
    startTest,
    stopTest,
    recordInteraction,
    generateReport,
    getCurrentDebounceTime,
    isTestActive: currentTest?.isActive || false
  };
};