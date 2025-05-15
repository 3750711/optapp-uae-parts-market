
import React from 'react';

interface DashboardHeaderProps {
  title: string;
  lastUpdated?: Date;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, lastUpdated = new Date() }) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Последнее обновление: {lastUpdated.toLocaleString('ru-RU')}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
