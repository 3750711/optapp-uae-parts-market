
import React from 'react';

interface CarouselDotsProps {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
  className?: string;
}

const CarouselDots: React.FC<CarouselDotsProps> = ({
  total,
  current,
  onDotClick,
  className = ''
}) => {
  if (total <= 1) return null;

  return (
    <div className={`flex justify-center space-x-2 ${className}`}>
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={`w-2 h-2 rounded-full transition-all ${
            index === current
              ? 'bg-optapp-yellow scale-125'
              : 'bg-white/50 hover:bg-white/70'
          }`}
          aria-label={`Перейти к изображению ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default CarouselDots;
