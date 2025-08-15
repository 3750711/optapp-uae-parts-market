import React from 'react';
import { OrderVideoFixer } from '@/components/admin/OrderVideoFixer';
import { EmbeddingsGenerator } from '@/components/admin/EmbeddingsGenerator';
import { SynonymManager } from '@/components/admin/synonyms/SynonymManager';

const AdminToolsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Инструменты администратора</h2>
        <p className="text-muted-foreground mb-6">
          Специализированные инструменты для обслуживания системы
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <OrderVideoFixer />
          <EmbeddingsGenerator />
        </div>
        <SynonymManager />
      </div>
    </div>
  );
};

export default AdminToolsSection;