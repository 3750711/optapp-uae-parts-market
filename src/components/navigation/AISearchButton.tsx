import React from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AISearchIndicator } from '@/components/search/AISearchIndicator';

interface AISearchButtonProps {
  variant?: "default" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export const AISearchButton: React.FC<AISearchButtonProps> = ({ 
  variant = "outline", 
  size = "default",
  className = "",
  showLabel = true
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/search/ai');
  };

  return (
    <Button 
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`transition-all hover:scale-105 ${className}`}
    >
      <Brain className="h-4 w-4 mr-2" />
      {showLabel && "ИИ Поиск"}
      {!showLabel && <Search className="h-4 w-4 ml-1" />}
    </Button>
  );
};