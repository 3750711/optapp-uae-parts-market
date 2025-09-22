import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Brain, Lightbulb, Target, TrendingUp, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CorrectionAnalysis {
  id: string;
  product_id: string;
  ai_suggestion: string;
  moderator_correction: string;
  differences: any[];
  extracted_rules: any[];
  processed_at: string;
  analysis_version: string;
}

interface AITranslationRule {
  id: string;
  original_phrase: string;
  corrected_phrase: string;
  usage_count: number;
  confidence_score: number;
  rule_type: string;
  created_at: string;
  last_used_at?: string;
}

export const AICorrectionAnalysis: React.FC = () => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  // Получение анализов исправлений
  const { data: analyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['ai-correction-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_correction_analysis')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as CorrectionAnalysis[];
    }
  });

  // Получение недавно созданных правил
  const { data: recentRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['recent-translation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_translation_rules')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as AITranslationRule[];
    }
  });

  // Статистика обучения
  const { data: stats } = useQuery({
    queryKey: ['ai-learning-stats'],
    queryFn: async () => {
      const { data: totalRules } = await supabase
        .from('ai_translation_rules')
        .select('id', { count: 'exact' });

      const { data: activeRules } = await supabase
        .from('ai_translation_rules')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      const { data: totalUsage } = await supabase
        .from('ai_translation_rules')
        .select('usage_count');

      const { data: totalAnalyses } = await supabase
        .from('ai_correction_analysis')
        .select('id', { count: 'exact' });

      return {
        totalRules: totalRules?.length || 0,
        activeRules: activeRules?.length || 0,
        totalUsage: totalUsage?.reduce((sum, rule) => sum + (rule.usage_count || 0), 0) || 0,
        totalAnalyses: totalAnalyses?.length || 0
      };
    }
  });

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'translation': return 'bg-blue-100 text-blue-800';
      case 'phrase_replacement': return 'bg-green-100 text-green-800';
      case 'phrase_simplification': return 'bg-purple-100 text-purple-800';
      case 'word_replacement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  if (analysesLoading || rulesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Анализ обучения ИИ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Загрузка данных...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика обучения */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Всего правил</p>
                <p className="text-2xl font-bold">{stats?.totalRules || 0}</p>
              </div>
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Активные правила</p>
                <p className="text-2xl font-bold text-green-600">{stats?.activeRules || 0}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Применений правил</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.totalUsage || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Анализов</p>
                <p className="text-2xl font-bold">{stats?.totalAnalyses || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <Tabs defaultValue="recent-rules" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recent-rules">Недавние правила</TabsTrigger>
          <TabsTrigger value="corrections-analysis">Анализ исправлений</TabsTrigger>
        </TabsList>

        <TabsContent value="recent-rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Недавно созданные правила обучения
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {recentRules?.map((rule) => (
                    <div key={rule.id} className="p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            "{rule.original_phrase}"
                          </span>
                          <span>→</span>
                          <span className="font-mono text-sm bg-green-100 px-2 py-1 rounded">
                            "{rule.corrected_phrase}"
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge className={getRuleTypeColor(rule.rule_type)}>
                            {rule.rule_type}
                          </Badge>
                          <span>Использовано: {rule.usage_count} раз</span>
                          <span>Уверенность: {(rule.confidence_score * 100).toFixed(0)}%</span>
                          <span>Создано: {formatDate(rule.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!recentRules || recentRules.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      Правила пока не создавались автоматически
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corrections-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Анализ исправлений модераторов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {analyses?.map((analysis) => (
                    <div key={analysis.id} className="p-4 border rounded-lg">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Предложение ИИ:
                            </p>
                            <p className="text-sm bg-blue-50 p-2 rounded">
                              {analysis.ai_suggestion}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Исправление модератора:
                            </p>
                            <p className="text-sm bg-green-50 p-2 rounded">
                              {analysis.moderator_correction}
                            </p>
                          </div>
                        </div>

                        {analysis.extracted_rules && analysis.extracted_rules.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Извлеченные правила:
                            </p>
                            <div className="space-y-1">
                              {analysis.extracted_rules.map((rule: any, index: number) => (
                                <div key={index} className="text-xs bg-yellow-50 p-2 rounded flex items-center gap-2">
                                  <Badge className={getRuleTypeColor(rule.type)}>
                                    {rule.type}
                                  </Badge>
                                  <span>"{rule.from}" → "{rule.to}"</span>
                                  <span className="text-muted-foreground">
                                    (уверенность: {(rule.confidence * 100).toFixed(0)}%)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Обработано: {formatDate(analysis.processed_at)} | 
                          Версия анализа: {analysis.analysis_version}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!analyses || analyses.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      Анализы исправлений пока не проводились
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};