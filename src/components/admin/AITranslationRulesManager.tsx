import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Edit, TestTube, Brain, TrendingUp } from 'lucide-react';
import { useAITranslationRules } from '@/hooks/useAITranslationRules';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AITranslationRulesManagerProps {
  className?: string;
}

export const AITranslationRulesManager: React.FC<AITranslationRulesManagerProps> = ({ className }) => {
  const {
    rules,
    activeRules,
    isLoading,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleActive,
    applyRulesToText,
    isCreating,
    isUpdating,
    isDeleting,
    isToggling,
    isApplying
  } = useAITranslationRules();

  const [newRule, setNewRule] = useState({
    original_phrase: '',
    corrected_phrase: '',
    rule_type: 'translation',
    confidence_score: 0.8
  });

  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState('');

  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    original_phrase: '',
    corrected_phrase: '',
    confidence_score: 0.8
  });

  const handleCreateRule = () => {
    if (!newRule.original_phrase.trim() || !newRule.corrected_phrase.trim()) {
      toast.error('Заполните оба поля для создания правила');
      return;
    }

    createRule(newRule);
    setNewRule({
      original_phrase: '',
      corrected_phrase: '',
      rule_type: 'translation',
      confidence_score: 0.8
    });
  };

  const handleTestRules = async () => {
    if (!testText.trim()) {
      toast.error('Введите текст для тестирования');
      return;
    }

    try {
      // Применяем правила напрямую через supabase RPC
      const { data: result, error } = await supabase.rpc('apply_translation_rules', {
        p_text: testText,
        p_limit: 50
      });
      
      if (error) {
        throw error;
      }
      
      setTestResult(result || testText);
      toast.success('Правила применены к тексту');
    } catch (error) {
      console.error('Error applying rules:', error);
      toast.error('Ошибка применения правил');
    }
  };

  const startEditing = (rule: any) => {
    setEditingRule(rule.id);
    setEditForm({
      original_phrase: rule.original_phrase,
      corrected_phrase: rule.corrected_phrase,
      confidence_score: rule.confidence_score
    });
  };

  const handleUpdate = (id: string) => {
    updateRule({ id, updates: editForm });
    setEditingRule(null);
  };

  const cancelEditing = () => {
    setEditingRule(null);
    setEditForm({
      original_phrase: '',
      corrected_phrase: '',
      confidence_score: 0.8
    });
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'translation': return 'bg-blue-100 text-blue-800';
      case 'phrase_replacement': return 'bg-green-100 text-green-800';
      case 'phrase_simplification': return 'bg-purple-100 text-purple-800';
      case 'word_replacement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Управление правилами перевода ИИ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Загрузка правил...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Всего правил</p>
                <p className="text-2xl font-bold">{rules.length}</p>
              </div>
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Активные правила</p>
                <p className="text-2xl font-bold text-green-600">{activeRules.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Общее использование</p>
                <p className="text-2xl font-bold">
                  {rules.reduce((sum, rule) => sum + rule.usage_count, 0)}
                </p>
              </div>
              <TestTube className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Создание нового правила */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Создать новое правило
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original-phrase">Исходная фраза</Label>
              <Input
                id="original-phrase"
                value={newRule.original_phrase}
                onChange={(e) => setNewRule({ ...newRule, original_phrase: e.target.value })}
                placeholder="носовая часть"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="corrected-phrase">Исправленная фраза</Label>
              <Input
                id="corrected-phrase"
                value={newRule.corrected_phrase}
                onChange={(e) => setNewRule({ ...newRule, corrected_phrase: e.target.value })}
                placeholder="nose cut"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rule-type">Тип правила</Label>
              <select
                id="rule-type"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={newRule.rule_type}
                onChange={(e) => setNewRule({ ...newRule, rule_type: e.target.value })}
              >
                <option value="translation">Перевод</option>
                <option value="phrase_replacement">Замена фразы</option>
                <option value="phrase_simplification">Упрощение фразы</option>
                <option value="word_replacement">Замена слова</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confidence">Уверенность (0.0 - 1.0)</Label>
              <Input
                id="confidence"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={newRule.confidence_score}
                onChange={(e) => setNewRule({ ...newRule, confidence_score: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <Button onClick={handleCreateRule} disabled={isCreating} className="w-full">
            {isCreating ? 'Создание...' : 'Создать правило'}
          </Button>
        </CardContent>
      </Card>

      {/* Тестирование правил */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Тестирование правил
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-text">Текст для тестирования</Label>
            <Textarea
              id="test-text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Введите текст для применения правил перевода..."
              rows={3}
            />
          </div>
          
          <Button onClick={handleTestRules} disabled={isApplying}>
            {isApplying ? 'Применение...' : 'Применить правила'}
          </Button>
          
          {testResult && (
            <div className="space-y-2">
              <Label>Результат</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-mono">{testResult}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Список правил */}
      <Card>
        <CardHeader>
          <CardTitle>Правила перевода ({rules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 border rounded-lg space-y-2">
                {editingRule === rule.id ? (
                  // Режим редактирования
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        value={editForm.original_phrase}
                        onChange={(e) => setEditForm({ ...editForm, original_phrase: e.target.value })}
                        placeholder="Исходная фраза"
                      />
                      <Input
                        value={editForm.corrected_phrase}
                        onChange={(e) => setEditForm({ ...editForm, corrected_phrase: e.target.value })}
                        placeholder="Исправленная фраза"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdate(rule.id)}
                        disabled={isUpdating}
                      >
                        Сохранить
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={cancelEditing}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Режим просмотра
                  <>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
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
                          {rule.last_used_at && (
                            <span>
                              Последнее использование: {new Date(rule.last_used_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => 
                            toggleRuleActive({ id: rule.id, isActive: checked })
                          }
                          disabled={isToggling}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRule(rule.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {rules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Правил пока нет. Создайте первое правило выше.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};