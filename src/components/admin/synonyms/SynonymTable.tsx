import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, RefreshCw } from 'lucide-react';
import { Synonym } from './SynonymManager';

interface SynonymTableProps {
  synonyms: Synonym[];
  loading: boolean;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export const SynonymTable: React.FC<SynonymTableProps> = ({
  synonyms,
  loading,
  onDelete,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Get unique categories
  const categories = Array.from(new Set(synonyms.map(s => s.category)));

  // Filter synonyms
  const filteredSynonyms = synonyms.filter(synonym => {
    const matchesSearch = 
      synonym.original_term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      synonym.synonym.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLanguage = languageFilter === 'all' || synonym.language === languageFilter;
    const matchesCategory = categoryFilter === 'all' || synonym.category === categoryFilter;

    return matchesSearch && matchesLanguage && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'brand': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'model': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'part': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getLanguageColor = (language: string) => {
    return language === 'ru' 
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по терминам..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все языки</SelectItem>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Показано {filteredSynonyms.length} из {synonyms.length} синонимов
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Оригинальный термин</TableHead>
              <TableHead>Синоним</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Язык</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead className="w-16">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : filteredSynonyms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm || languageFilter !== 'all' || categoryFilter !== 'all' 
                    ? 'Синонимы не найдены по заданным фильтрам'
                    : 'Синонимы не найдены'
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredSynonyms.map((synonym) => (
                <TableRow key={synonym.id}>
                  <TableCell className="font-medium">{synonym.original_term}</TableCell>
                  <TableCell>{synonym.synonym}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(synonym.category)}>
                      {synonym.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLanguageColor(synonym.language)}>
                      {synonym.language.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(synonym.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(synonym.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};