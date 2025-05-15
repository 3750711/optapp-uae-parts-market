
import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  link: string;
  bgColor?: string;
  textColor?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  link,
  bgColor = 'bg-optapp-yellow',
  textColor = 'text-optapp-dark'
}) => {
  return (
    <Link to={link}>
      <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${bgColor}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${textColor}`}>{title}</CardTitle>
          <Icon className={`h-4 w-4 ${textColor}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${textColor}`}>+</div>
          <p className={`text-xs ${textColor} mt-1`}>{subtitle}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ActionCard;
