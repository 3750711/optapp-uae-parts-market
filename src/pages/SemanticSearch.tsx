import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SemanticSearchPanel } from '@/components/search/SemanticSearchPanel';

const SemanticSearch: React.FC = () => {
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
        </div>
      </main>
    </>
  );
};

export default SemanticSearch;