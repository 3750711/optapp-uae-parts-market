import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const ExportDataButton: React.FC = () => {
  return (
    <Button variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Экспорт
    </Button>
  );
};
