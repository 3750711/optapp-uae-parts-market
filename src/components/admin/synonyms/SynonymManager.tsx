import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Languages, Database } from 'lucide-react';
import { SynonymTable } from './SynonymTable';
import { SynonymGenerationForm } from './SynonymGenerationForm';
import { supabase } from '@/integrations/supabase/client';

export interface Synonym {
  id: string;
  original_term: string;
  synonym: string;
  category: string;
  language: string;
  created_at: string;
}

export const SynonymManager: React.FC = () => {
  const [synonyms, setSynonyms] = useState<Synonym[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, ru: 0, en: 0 });

  const fetchSynonyms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('search_synonyms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSynonyms(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const ru = data?.filter(s => s.language === 'ru').length || 0;
      const en = data?.filter(s => s.language === 'en').length || 0;
      setStats({ total, ru, en });
    } catch (error) {
      console.error('Error fetching synonyms:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSynonym = async (id: string) => {
    try {
      const { error } = await supabase
        .from('search_synonyms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSynonyms(synonyms.filter(s => s.id !== id));
      setStats(prev => ({ 
        ...prev, 
        total: prev.total - 1,
        ru: synonyms.find(s => s.id === id)?.language === 'ru' ? prev.ru - 1 : prev.ru,
        en: synonyms.find(s => s.id === id)?.language === 'en' ? prev.en - 1 : prev.en
      }));
    } catch (error) {
      console.error('Error deleting synonym:', error);
    }
  };

  const onSynonymsGenerated = () => {
    fetchSynonyms();
  };

  useEffect(() => {
    fetchSynonyms();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Управление синонимами поиска
        </CardTitle>
        <CardDescription>
          Генерация и управление синонимами для улучшения поиска товаров
        </CardDescription>
        
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <Database className="h-4 w-4" />
            <span>Всего: {stats.total}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            RU: {stats.ru} | EN: {stats.en}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="view">Просмотр синонимов</TabsTrigger>
            <TabsTrigger value="generate">Генерация</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view" className="space-y-4">
            <SynonymTable
              synonyms={synonyms}
              loading={loading}
              onDelete={deleteSynonym}
              onRefresh={fetchSynonyms}
            />
          </TabsContent>
          
          <TabsContent value="generate" className="space-y-4">
            <SynonymGenerationForm onSynonymsGenerated={onSynonymsGenerated} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};