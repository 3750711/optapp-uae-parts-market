
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import { getDetailedSecurityReport, type SecurityAuditResult } from '@/utils/securityAudit';

const SecurityDashboard: React.FC = () => {
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const performAudit = async () => {
    setIsLoading(true);
    try {
      const result = await getDetailedSecurityReport();
      setAuditResult(result);
    } catch (error) {
      console.error('Security audit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    performAudit();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return 'Отлично';
    if (score >= 70) return 'Хорошо';
    if (score >= 50) return 'Требует внимания';
    return 'Критично';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Eye className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (!auditResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Панель безопасности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Выполняется аудит безопасности...</span>
              </div>
            ) : (
              <Button onClick={performAudit}>
                Запустить аудит безопасности
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Общий счет */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Оценка безопасности
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={performAudit}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Обновить
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(auditResult.score)}`}>
              {auditResult.score}/100
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {getScoreStatus(auditResult.score)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Последняя проверка: {auditResult.timestamp.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Критические проблемы */}
      {auditResult.issues.filter(i => i.severity === 'critical').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Критические уязвимости обнаружены!</strong>
            <br />
            {auditResult.issues.filter(i => i.severity === 'critical').length} критических проблем требуют немедленного решения.
          </AlertDescription>
        </Alert>
      )}

      {/* Рекомендации */}
      <Card>
        <CardHeader>
          <CardTitle>Рекомендации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditResult.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Детали проблем */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Обнаруженные проблемы ({auditResult.issues.length})
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Скрыть детали' : 'Показать детали'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditResult.issues.length === 0 ? (
            <div className="text-center py-4 text-green-600">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <div>Критических проблем не обнаружено!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {auditResult.issues.map((issue, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(issue.severity)}
                      <span className="font-medium">{issue.description}</span>
                    </div>
                    <Badge variant={getSeverityColor(issue.severity) as any}>
                      {issue.severity}
                    </Badge>
                  </div>
                  
                  {issue.table && (
                    <div className="text-sm text-muted-foreground mb-1">
                      Таблица: <code className="bg-muted px-1 rounded">{issue.table}</code>
                    </div>
                  )}
                  
                  {showDetails && issue.details && (
                    <div className="text-sm text-muted-foreground">
                      {issue.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Статистика по категориям */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика по категориям</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['rls', 'validation', 'authentication', 'authorization', 'data_exposure'].map(category => {
              const count = auditResult.issues.filter(i => i.category === category).length;
              return (
                <div key={category} className="text-center p-3 border rounded-lg">
                  <div className="font-medium text-sm capitalize">
                    {category.replace('_', ' ')}
                  </div>
                  <div className={`text-lg font-bold ${count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
