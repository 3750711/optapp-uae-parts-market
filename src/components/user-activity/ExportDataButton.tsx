import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileJson } from 'lucide-react';
import { useActivityData } from '@/hooks/user-activity/useActivityData';
import { useActivityFilters } from '@/hooks/user-activity/useActivityFilters';
import { useActivityExport } from '@/hooks/user-activity/useActivityExport';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export const ExportDataButton: React.FC = () => {
  const { filters } = useActivityFilters();
  const { data = [] } = useActivityData(filters);
  const { exportToCSV, exportToJSON } = useActivityExport();

  const handleExportCSV = () => {
    const filename = `activity-${format(new Date(), 'yyyy-MM-dd-HHmm', { locale: ru })}.csv`;
    exportToCSV(data, filename);
  };

  const handleExportJSON = () => {
    const filename = `activity-${format(new Date(), 'yyyy-MM-dd-HHmm', { locale: ru })}.json`;
    exportToJSON(data, filename);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Экспорт в CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Экспорт в JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
