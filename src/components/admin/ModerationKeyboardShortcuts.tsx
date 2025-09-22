import React, { useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Keyboard, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModerationKeyboardShortcutsProps {
  onPublish?: () => void;
  onReject?: () => void;
  onAiEnrich?: () => void;
  onReset?: () => void;
  onNextProduct?: () => void;
  onPrevProduct?: () => void;
  disabled?: boolean;
  className?: string;
}

const shortcuts = [
  { key: 'P', action: 'Опубликовать', color: 'bg-green-100 text-green-800' },
  { key: 'R', action: 'Сбросить', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'A', action: 'AI обогащение', color: 'bg-purple-100 text-purple-800' },
  { key: '→', action: 'Следующий', color: 'bg-blue-100 text-blue-800' },
  { key: '←', action: 'Предыдущий', color: 'bg-blue-100 text-blue-800' },
];

export const ModerationKeyboardShortcuts: React.FC<ModerationKeyboardShortcutsProps> = ({
  onPublish,
  onReject,
  onAiEnrich,
  onReset,
  onNextProduct,
  onPrevProduct,
  disabled = false,
  className
}) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (disabled) return;
    
    // Игнорируем если пользователь печатает в input/textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // Ctrl/Cmd + клавиша для основных действий
    const isModifierPressed = event.ctrlKey || event.metaKey;
    
    switch (event.key.toLowerCase()) {
      case 'p':
        if (isModifierPressed && onPublish) {
          event.preventDefault();
          onPublish();
        }
        break;
      case 'r':
        if (isModifierPressed && onReset) {
          event.preventDefault();
          onReset();
        }
        break;
      case 'a':
        if (isModifierPressed && onAiEnrich) {
          event.preventDefault();
          onAiEnrich();
        }
        break;
      case 'arrowright':
        if (onNextProduct) {
          event.preventDefault();
          onNextProduct();
        }
        break;
      case 'arrowleft':
        if (onPrevProduct) {
          event.preventDefault();
          onPrevProduct();
        }
        break;
    }
  }, [disabled, onPublish, onReject, onAiEnrich, onReset, onNextProduct, onPrevProduct]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <Card className={cn("border-dashed border-muted-foreground/20", className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Быстрые клавиши</span>
          </div>
          <Zap className="h-3 w-3 text-muted-foreground" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs font-mono", shortcut.color)}
              >
                {shortcut.key === 'P' || shortcut.key === 'R' || shortcut.key === 'A' ? (
                  <>Ctrl+{shortcut.key}</>
                ) : (
                  shortcut.key
                )}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                {shortcut.action}
              </span>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground mt-2 opacity-75">
          Используйте клавиши для быстрой модерации товаров
        </div>
      </CardContent>
    </Card>
  );
};