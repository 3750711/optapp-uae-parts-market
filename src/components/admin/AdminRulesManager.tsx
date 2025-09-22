import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { 
  useAIPromptRules, 
  useCreateAIPromptRule, 
  useUpdateAIPromptRule, 
  useDeleteAIPromptRule,
  useToggleRuleActive,
  type AIPromptRule 
} from '@/hooks/useAIPromptRules';

const RULE_CATEGORIES = [
  { value: 'translations', label: 'Переводы' },
  { value: 'spelling', label: 'Исправления' },
  { value: 'part_codes', label: 'Коды деталей' },
  { value: 'brands', label: 'Марки и модели' },
  { value: 'general', label: 'Общие' },
];

const AdminRulesManager: React.FC = () => {
  const { data: rules = [], isLoading } = useAIPromptRules();
  const createRule = useCreateAIPromptRule();
  const updateRule = useUpdateAIPromptRule();
  const deleteRule = useDeleteAIPromptRule();
  const toggleActive = useToggleRuleActive();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_text: '',
    rule_category: 'general',
    is_active: true,
    display_order: 0,
  });

  const handleCreateRule = async () => {
    if (!newRule.rule_text.trim()) return;
    
    await createRule.mutateAsync({
      ...newRule,
      display_order: Math.max(...rules.map(r => r.display_order), 0) + 1,
    });
    
    setNewRule({ rule_text: '', rule_category: 'general', is_active: true, display_order: 0 });
    setShowAddForm(false);
  };

  const handleUpdateRule = async (id: string, updates: Partial<AIPromptRule>) => {
    await updateRule.mutateAsync({ id, ...updates });
    setEditingId(null);
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    await toggleActive.mutateAsync({ id, is_active });
  };

  const handleDeleteRule = async (id: string) => {
    if (window.confirm('Удалить это правило?')) {
      await deleteRule.mutateAsync(id);
    }
  };

  const getCategoryLabel = (category: string) => {
    return RULE_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Загрузка правил...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Администраторские правила ИИ</h3>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-1" />
          Добавить правило
        </Button>
      </div>

      {/* Add Rule Form */}
      {showAddForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Новое правило</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select value={newRule.rule_category} onValueChange={(value) => setNewRule(prev => ({ ...prev, rule_category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {RULE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Текст правила..."
              value={newRule.rule_text}
              onChange={(e) => setNewRule(prev => ({ ...prev, rule_text: e.target.value }))}
              className="min-h-[80px]"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newRule.is_active}
                  onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, is_active: checked }))}
                />
                <span className="text-sm">Активно</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Отмена
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateRule}
                  disabled={!newRule.rule_text.trim() || createRule.isPending}
                >
                  {createRule.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Сохранить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id} className={`${!rule.is_active ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getCategoryLabel(rule.rule_category)}
                    </Badge>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => handleToggleActive(rule.id, checked)}
                    />
                  </div>
                  
                  {editingId === rule.id ? (
                    <EditRuleForm
                      rule={rule}
                      onSave={(updates) => handleUpdateRule(rule.id, updates)}
                      onCancel={() => setEditingId(null)}
                      isLoading={updateRule.isPending}
                    />
                  ) : (
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {rule.rule_text}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(rule.id)}
                    disabled={editingId === rule.id}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    disabled={deleteRule.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          Нет правил. Добавьте первое правило.
        </div>
      )}
    </div>
  );
};

interface EditRuleFormProps {
  rule: AIPromptRule;
  onSave: (updates: Partial<AIPromptRule>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const EditRuleForm: React.FC<EditRuleFormProps> = ({
  rule,
  onSave,
  onCancel,
  isLoading
}) => {
  const [ruleText, setRuleText] = useState(rule.rule_text);
  const [category, setCategory] = useState(rule.rule_category);

  const handleSave = () => {
    onSave({
      rule_text: ruleText,
      rule_category: category,
    });
  };

  return (
    <div className="space-y-3">
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RULE_CATEGORIES.map(cat => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Textarea
        value={ruleText}
        onChange={(e) => setRuleText(e.target.value)}
        className="min-h-[80px]"
      />
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" />
          Отмена
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Сохранить
        </Button>
      </div>
    </div>
  );
};

export default AdminRulesManager;