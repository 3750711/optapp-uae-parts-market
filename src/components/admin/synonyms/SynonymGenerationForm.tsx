import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, X, Loader2 } from 'lucide-react';
import { useSynonymGeneration } from '@/hooks/useSynonymGeneration';

interface SynonymGenerationFormProps {
  onSynonymsGenerated: () => void;
}

const PREDEFINED_TERMS = {
  parts: [
    'двигатель', 'коробка передач', 'подвеска', 'тормоза', 'фары', 'бампер',
    'капот', 'дверь', 'зеркало', 'стекло', 'колесо', 'диск', 'радиатор',
    'глушитель', 'аккумулятор', 'генератор', 'стартер', 'насос'
  ],
  brands: [
    'BMW', 'Mercedes', 'Toyota', 'Audi', 'Volkswagen', 'Honda', 'Nissan',
    'Ford', 'Chevrolet', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Volvo',
    'Lexus', 'Infiniti', 'Acura', 'Porsche', 'Jaguar', 'Land Rover'
  ],
  models: [
    'Camry', 'Corolla', 'Prius', 'RAV4', 'Highlander', 'X5', 'X3', 'X1',
    'E-Class', 'C-Class', 'S-Class', 'A4', 'A6', 'Q5', 'Q7', 'Golf',
    'Passat', 'Tiguan', 'Accord', 'Civic', 'CR-V', 'Pilot'
  ]
};

export const SynonymGenerationForm: React.FC<SynonymGenerationFormProps> = ({
  onSynonymsGenerated,
}) => {
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('general');
  const [language, setLanguage] = useState('ru');
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const { generateSynonyms, isGenerating } = useSynonymGeneration();

  const handleAddTerm = () => {
    if (term.trim() && !selectedTerms.includes(term.trim())) {
      setSelectedTerms([...selectedTerms, term.trim()]);
      setTerm('');
    }
  };

  const handleRemoveTerm = (termToRemove: string) => {
    setSelectedTerms(selectedTerms.filter(t => t !== termToRemove));
  };

  const handleAddPredefinedTerm = (predefinedTerm: string) => {
    if (!selectedTerms.includes(predefinedTerm)) {
      setSelectedTerms([...selectedTerms, predefinedTerm]);
    }
  };

  const handleGenerateAll = async () => {
    if (selectedTerms.length === 0) return;

    for (const termToGenerate of selectedTerms) {
      await generateSynonyms({
        term: termToGenerate,
        category: category as 'brand' | 'model' | 'part' | 'general',
        language: language as 'ru' | 'en'
      });
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setSelectedTerms([]);
    onSynonymsGenerated();
  };

  const handleGenerateSingle = async () => {
    if (!term.trim()) return;

    await generateSynonyms({
      term: term.trim(),
      category: category as 'brand' | 'model' | 'part' | 'general',
      language: language as 'ru' | 'en'
    });

    setTerm('');
    onSynonymsGenerated();
  };

  const getCategoryTerms = () => {
    switch (category) {
      case 'brand': return PREDEFINED_TERMS.brands;
      case 'model': return PREDEFINED_TERMS.models;
      case 'part': return PREDEFINED_TERMS.parts;
      default: return [...PREDEFINED_TERMS.parts, ...PREDEFINED_TERMS.brands, ...PREDEFINED_TERMS.models];
    }
  };

  return (
    <div className="space-y-6">
      {/* Single term generation */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-medium">Генерация одного термина</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="category">Категория</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Общая</SelectItem>
                <SelectItem value="brand">Бренд</SelectItem>
                <SelectItem value="model">Модель</SelectItem>
                <SelectItem value="part">Запчасть</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language">Язык</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="term">Термин</Label>
            <div className="flex gap-2">
              <Input
                id="term"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerateSingle()}
                placeholder="Введите термин"
              />
              <Button
                onClick={handleGenerateSingle}
                disabled={!term.trim() || isGenerating}
                size="sm"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch generation */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-medium">Массовая генерация</h3>
        
        {/* Add custom term */}
        <div className="flex gap-2">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTerm()}
            placeholder="Добавить термин в очередь"
          />
          <Button onClick={handleAddTerm} disabled={!term.trim()} size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Predefined terms */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Популярные термины для категории "{category}"
          </Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {getCategoryTerms().map((predefinedTerm) => (
              <Button
                key={predefinedTerm}
                variant="outline"
                size="sm"
                onClick={() => handleAddPredefinedTerm(predefinedTerm)}
                disabled={selectedTerms.includes(predefinedTerm)}
                className="h-7"
              >
                {predefinedTerm}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected terms */}
        {selectedTerms.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Выбранные термины ({selectedTerms.length})
            </Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedTerms.map((selectedTerm) => (
                <Badge
                  key={selectedTerm}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {selectedTerm}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-600"
                    onClick={() => handleRemoveTerm(selectedTerm)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGenerateAll}
          disabled={selectedTerms.length === 0 || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Генерирую синонимы...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Сгенерировать синонимы для {selectedTerms.length} терминов
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Генерация займет около {selectedTerms.length * 3-5} секунд. 
          Между запросами есть задержка в 1 секунду.
        </p>
      </div>
    </div>
  );
};