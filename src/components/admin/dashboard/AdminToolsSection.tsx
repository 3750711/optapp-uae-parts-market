import React from 'react';

const AdminToolsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Инструменты администратора</h2>
        <p className="text-muted-foreground mb-6">
          Специализированные инструменты для обслуживания системы
        </p>
      </div>
      
      <div className="text-center text-muted-foreground py-8">
        <p>Специализированные инструменты будут добавлены здесь по мере необходимости</p>
      </div>
    </div>
  );
};

export default AdminToolsSection;