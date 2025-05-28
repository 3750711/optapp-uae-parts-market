
import React, { useEffect } from "react";

interface KeyboardShortcutsProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  onSearch?: () => void;
  disabled?: boolean;
}

const KeyboardShortcuts = React.memo(({ 
  onCancel, 
  onSubmit, 
  onSearch, 
  disabled = false 
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    if (disabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Игнорируем если пользователь печатает в input или textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Но обрабатываем Escape даже в полях ввода
        if (event.key === 'Escape' && onCancel) {
          event.preventDefault();
          onCancel();
        }
        return;
      }

      switch (event.key) {
        case 'Escape':
          if (onCancel) {
            event.preventDefault();
            onCancel();
          }
          break;
        case 'Enter':
          if (event.ctrlKey && onSubmit) {
            event.preventDefault();
            onSubmit();
          }
          break;
        case '/':
          if (event.ctrlKey && onSearch) {
            event.preventDefault();
            onSearch();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [onCancel, onSubmit, onSearch, disabled]);

  return null;
});

KeyboardShortcuts.displayName = "KeyboardShortcuts";

export default KeyboardShortcuts;
