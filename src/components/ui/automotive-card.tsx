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
      "backdrop-blur-xl bg-white/5 dark:bg-black/5",
      "border border-white/10 dark:border-white/5",
      "motion-reduce:transition-none motion-reduce:hover:transform-none",
      hover3d && "hover:transform hover:scale-105 hover:shadow-2xl hover:-translate-y-1",
      metallic && "bg-gradient-metallic border-border/30",
      glowing && "shadow-glow hover:shadow-glow",
      className
    )}>
      {/* Animated gradient background */}
      {metallic && (
        <>
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-gradient-shift pointer-events-none" 
            style={{ backgroundSize: '200% 200%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        </>
      )}
      
      {/* Chrome edge highlight */}
      {hover3d && (
        <div className="absolute inset-[1px] rounded-[inherit] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      )}
      
      {children}
    </Card>
  );
};