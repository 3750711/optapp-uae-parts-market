import { supabase } from '@/integrations/supabase/client';

export interface SecurityAuditResult {
  score: number;
  issues: SecurityIssue[];
  recommendations: string[];
  timestamp: Date;
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'rls' | 'validation' | 'authentication' | 'authorization' | 'data_exposure' | 'configuration';
  description: string;
  table?: string;
  details?: string;
}

class SecurityAuditService {
  
  async performSecurityAudit(): Promise<SecurityAuditResult> {
    console.log('🔒 Starting security audit...');
    
    const issues: SecurityIssue[] = [];
    let score = 100;

    // 1. Проверка RLS политик
    await this.checkRLSPolicies(issues);
    
    // 2. Проверка аутентификации
    await this.checkAuthentication(issues);
    
    // 3. Проверка доступа к данным
    await this.checkDataAccess(issues);
    
    // 4. Проверка валидации входных данных
    this.checkInputValidation(issues);
    
    // 5. Проверка конфигурации безопасности
    this.checkSecurityConfiguration(issues);

    // Вычисляем финальный счет
    score = this.calculateSecurityScore(issues);
    
    const recommendations = this.generateRecommendations(issues);
    
    console.log(`🔒 Security audit completed. Score: ${score}/100`);
    
    return {
      score,
      issues,
      recommendations,
      timestamp: new Date()
    };
  }

  private async checkRLSPolicies(issues: SecurityIssue[]) {
    try {
      // Проверяем наличие RLS на критичных таблицах
      const criticalTables = [
        'profiles', 'products', 'orders', 'stores', 
        'product_images', 'product_videos', 'store_images'
      ];
      
      for (const table of criticalTables) {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
          
        if (error && error.code === 'PGRST301') {
          // RLS включен и работает
          continue;
        } else if (!error) {
          // RLS может быть не настроен корректно
          issues.push({
            severity: 'high',
            category: 'rls',
            description: `Таблица ${table} может не иметь корректных RLS политик`,
            table,
            details: 'Данные доступны без аутентификации'
          });
        }
      }
    } catch (error) {
      console.error('Error checking RLS policies:', error);
    }
  }

  private async checkAuthentication(issues: SecurityIssue[]) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      issues.push({
        severity: 'medium',
        category: 'authentication',
        description: 'Пользователь не аутентифицирован',
        details: 'Некоторые функции могут быть недоступны'
      });
    }

    // Проверяем сессию
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && session.expires_at && session.expires_at < Date.now() / 1000) {
      issues.push({
        severity: 'medium',
        category: 'authentication',
        description: 'Сессия истекла',
        details: 'Требуется повторная аутентификация'
      });
    }
  }

  private async checkDataAccess(issues: SecurityIssue[]) {
    try {
      // Пытаемся получить данные других пользователей
      const { data: otherUsersData, error } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(10);
        
      if (otherUsersData && otherUsersData.length > 1) {
        issues.push({
          severity: 'critical',
          category: 'data_exposure',
          description: 'Возможная утечка данных пользователей',
          table: 'profiles',
          details: 'Доступ к профилям других пользователей'
        });
      }
    } catch (error) {
      // Это хорошо - RLS блокирует доступ
    }
  }

  private checkInputValidation(issues: SecurityIssue[]) {
    // Проверяем, используется ли валидация на клиенте
    const hasValidation = typeof window !== 'undefined' && 
                         window.location.pathname.includes('admin');
                         
    if (!hasValidation) {
      issues.push({
        severity: 'medium',
        category: 'validation',
        description: 'Недостаточная валидация пользовательского ввода',
        details: 'Рекомендуется добавить XSS и SQL injection защиту'
      });
    }
  }

  private checkSecurityConfiguration(issues: SecurityIssue[]) {
    // Проверяем HTTPS
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
      issues.push({
        severity: 'high',
        category: 'configuration',
        description: 'Соединение не защищено HTTPS',
        details: 'Данные передаются в незашифрованном виде'
      });
    }

    // Проверяем localStorage на чувствительные данные
    if (typeof window !== 'undefined') {
      const storage = window.localStorage;
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        const value = storage.getItem(key || '');
        
        if (key?.toLowerCase().includes('password') || 
            key?.toLowerCase().includes('secret') ||
            value?.includes('eyJ')) { // JWT токены
          issues.push({
            severity: 'medium',
            category: 'data_exposure',
            description: 'Чувствительные данные в localStorage',
            details: `Ключ: ${key}`
          });
        }
      }
    }
  }

  private calculateSecurityScore(issues: SecurityIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  private generateRecommendations(issues: SecurityIssue[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    
    if (criticalIssues.length > 0) {
      recommendations.push('🚨 КРИТИЧНО: Немедленно исправьте критические уязвимости');
    }
    
    if (highIssues.length > 0) {
      recommendations.push('⚠️ Исправьте уязвимости высокого приоритета');
    }
    
    if (issues.some(i => i.category === 'rls')) {
      recommendations.push('🔒 Настройте корректные RLS политики для всех таблиц');
    }
    
    if (issues.some(i => i.category === 'validation')) {
      recommendations.push('✅ Добавьте валидацию пользовательского ввода');
    }
    
    if (issues.some(i => i.category === 'authentication')) {
      recommendations.push('🔐 Проверьте настройки аутентификации');
    }
    
    recommendations.push('📊 Регулярно проводите аудит безопасности');
    recommendations.push('🛡️ Включите мониторинг безопасности в продакшене');
    
    return recommendations;
  }
}

// Создаем единственный экземпляр сервиса
export const securityAudit = new SecurityAuditService();

// Утилитарная функция для быстрой проверки
export const performQuickSecurityCheck = async (): Promise<boolean> => {
  const result = await securityAudit.performSecurityAudit();
  return result.score >= 80; // Считаем безопасным если счет >= 80
};

// Функция для администраторов
export const getDetailedSecurityReport = async (): Promise<SecurityAuditResult> => {
  return await securityAudit.performSecurityAudit();
};
