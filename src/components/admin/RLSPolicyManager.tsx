
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Trash2, RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RLSPolicy {
  schema_name: string;
  table_name: string;
  policy_name: string;
  policy_roles: string[];
  policy_cmd: string;
  policy_qual: string;
}

const RLSPolicyManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClearing, setIsClearing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Получение текущих политик
  const { data: policies, isLoading, error, refetch } = useQuery({
    queryKey: ['rls-policies'],
    queryFn: async () => {
      console.log('🔍 Fetching RLS policies...');
      const { data, error } = await supabase.rpc('get_rls_policies_status');
      
      if (error) {
        console.error('❌ Error fetching RLS policies:', error);
        throw error;
      }
      
      console.log('✅ RLS policies fetched:', data?.length || 0, 'policies');
      return data as RLSPolicy[];
    },
    staleTime: 30000, // 30 seconds
    retry: 2
  });

  // Очистка всех политик
  const clearPoliciesMutation = useMutation({
    mutationFn: async () => {
      console.log('🧹 Clearing all RLS policies...');
      const { data, error } = await supabase.rpc('clear_all_rls_policies');
      
      if (error) {
        console.error('❌ Error clearing RLS policies:', error);
        throw error;
      }
      
      console.log('✅ RLS policies cleared:', data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Политики очищены",
        description: data || "Все RLS политики успешно удалены",
      });
      queryClient.invalidateQueries({ queryKey: ['rls-policies'] });
    },
    onError: (error) => {
      console.error('💥 Clear policies error:', error);
      toast({
        variant: "destructive",
        title: "Ошибка очистки",
        description: error instanceof Error ? error.message : "Не удалось очистить политики",
      });
    }
  });

  // Восстановление базовых политик
  const restorePoliciesMutation = useMutation({
    mutationFn: async () => {
      console.log('🔧 Restoring basic RLS policies...');
      const { data, error } = await supabase.rpc('restore_basic_rls_policies');
      
      if (error) {
        console.error('❌ Error restoring RLS policies:', error);
        throw error;
      }
      
      console.log('✅ RLS policies restored:', data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Политики восстановлены",
        description: data || "Базовые RLS политики успешно созданы",
      });
      queryClient.invalidateQueries({ queryKey: ['rls-policies'] });
    },
    onError: (error) => {
      console.error('💥 Restore policies error:', error);
      toast({
        variant: "destructive",
        title: "Ошибка восстановления",
        description: error instanceof Error ? error.message : "Не удалось восстановить политики",
      });
    }
  });

  const handleClearPolicies = async () => {
    if (!confirm('⚠️ Вы уверены, что хотите удалить ВСЕ RLS политики? Это может нарушить доступ к данным.')) {
      return;
    }
    
    setIsClearing(true);
    try {
      await clearPoliciesMutation.mutateAsync();
    } finally {
      setIsClearing(false);
    }
  };

  const handleRestorePolicies = async () => {
    setIsRestoring(true);
    try {
      await restorePoliciesMutation.mutateAsync();
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Обновление",
      description: "Статус политик обновлен",
    });
  };

  // Группировка политик по таблицам
  const groupedPolicies = policies?.reduce((acc, policy) => {
    const key = policy.table_name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(policy);
    return acc;
  }, {} as Record<string, RLSPolicy[]>) || {};

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Управление RLS политиками
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загрузка политик...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Управление RLS политиками
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ошибка загрузки политик: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Управление RLS политиками
          </CardTitle>
          <CardDescription>
            Управление политиками Row Level Security для контроля доступа к данным
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Статистика */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-3 py-1">
                Всего политик: {policies?.length || 0}
              </Badge>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Таблиц: {Object.keys(groupedPolicies).length}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </div>

          {/* Действия */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleClearPolicies}
              disabled={isClearing || clearPoliciesMutation.isPending}
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Очистить все политики
            </Button>
            <Button
              variant="default"
              onClick={handleRestorePolicies}
              disabled={isRestoring || restorePoliciesMutation.isPending}
            >
              {isRestoring ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Восстановить базовые политики
            </Button>
          </div>

          {/* Предупреждение */}
          {policies && policies.length === 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ Политики RLS не найдены! Это означает, что доступ к данным может быть нарушен.
                Рекомендуется восстановить базовые политики.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Список политик по таблицам */}
      {Object.keys(groupedPolicies).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Текущие политики по таблицам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedPolicies).map(([tableName, tablePolicies]) => (
                <div key={tableName} className="space-y-2">
                  <h3 className="text-lg font-medium border-b pb-2">
                    Таблица: <span className="font-mono text-blue-600">{tableName}</span>
                    <Badge variant="secondary" className="ml-2">
                      {tablePolicies.length} политик
                    </Badge>
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название политики</TableHead>
                        <TableHead>Команда</TableHead>
                        <TableHead>Условие</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tablePolicies.map((policy, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">
                            {policy.policy_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{policy.policy_cmd}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-md truncate">
                            {policy.policy_qual || 'Нет условий'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RLSPolicyManager;
