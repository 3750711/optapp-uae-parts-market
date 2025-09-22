import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { SemanticSearchPanel } from '@/components/search/SemanticSearchPanel';
import { SmartSearchSuggestions } from '@/components/search/SmartSearchSuggestions';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';

const SemanticSearch: React.FC = () => {
  const { search } = useSemanticSearch();
  const [query, setQuery] = useState('');
  const [threshold, setThreshold] = useState([0.7]);
  const [limit, setLimit] = useState([20]);
  const [filters, setFilters] = useState({});

  return (
    <>
      <Helmet>
        <title>ИИ Поиск - PartsBay</title>
        <meta name="description" content="Интеллектуальный поиск автозапчастей с использованием семантического анализа и ИИ" />
        <meta name="keywords" content="поиск автозапчастей, семантический поиск, ИИ, автозапчасти ОАЭ" />
      </Helmet>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-4">
              Интеллектуальный поиск автозапчастей
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Найдите нужные детали используя естественный язык. 
              ИИ понимает контекст и находит наиболее подходящие товары.
            </p>
          </div>
          
          <SemanticSearchPanel />
          
          <SmartSearchSuggestions 
            onSuggestionClick={(query) => {
              setQuery(query);
              search(query, {
                threshold: threshold[0],
                limit: limit[0],
                filters,
              });
            }}
          />
        </div>
      </main>
    </>
  );
};

export default SemanticSearch;