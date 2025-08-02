import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AutomotiveCardProps {
  children: React.ReactNode;
  className?: string;
  hover3d?: boolean;
  metallic?: boolean;
  glowing?: boolean;
}

export const AutomotiveCard: React.FC<AutomotiveCardProps> = ({
  children,
  className,
  hover3d = false,
  metallic = false,
  glowing = false
}) => {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-500",
      "bg-card/60 backdrop-blur-sm border border-border/20",
      hover3d && "hover:transform hover:rotate-x-2 hover:rotate-y-2 hover:scale-105 hover:shadow-metallic",
      metallic && "bg-gradient-metallic border-border/30",
      glowing && "shadow-glow hover:shadow-glow",
      className
    )}>
      {/* Automotive reflection effect */}
      {metallic && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
      )}
      
      {/* Chrome edge highlight */}
      {hover3d && (
        <div className="absolute inset-[1px] rounded-[inherit] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      )}
      
      {children}
    </Card>
  );
};