
import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardMetricCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  link: string;
  highlight?: boolean;
  warningText?: string | null;
  bgColor?: string;
  isLoading?: boolean;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  link,
  highlight = false,
  warningText,
  bgColor = '#FEF7CD',
  isLoading = false,
}) => {
  const cardStyle = highlight ? { backgroundColor: bgColor } : {};
  
  return (
    <Link to={link}>
      <Card 
        className={`hover:shadow-lg transition-shadow cursor-pointer ${highlight ? 'bg-[#FEF7CD]' : ''}`}
        style={cardStyle}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? '...' : value}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
            {warningText && (
              <span className="ml-1 text-amber-600">{warningText}</span>
            )}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default DashboardMetricCard;
