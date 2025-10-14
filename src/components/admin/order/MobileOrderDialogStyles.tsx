
import React from 'react';

export const MobileOrderDialogStyles = () => {
  React.useEffect(() => {
    // Добавляем стили для мобильной версии диалога
    const style = document.createElement('style');
    style.textContent = `
      /* Мобильная оптимизация для диалога редактирования заказа */
      @media (max-width: 768px) {
        .touch-target {
          min-height: 44px;
          min-width: 44px;
          touch-action: manipulation;
        }
        
        /* Защита от виртуальной клавиатуры */
        .keyboard-protection {
          padding-bottom: max(1rem, env(keyboard-inset-height, 0px));
        }
        
        /* Smooth scrolling для iOS */
        .mobile-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        
        /* Фиксированный footer с blur эффектом */
        .mobile-dialog-footer {
          position: fixed;
          bottom: env(safe-area-inset-bottom, 0px);
          left: env(safe-area-inset-left, 0px);
          right: env(safe-area-inset-right, 0px);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-top: 1px solid rgba(229, 231, 235, 0.8);
          padding: 0.75rem 1rem;
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom, 0px));
          z-index: 50;
          box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        /* Высота диалога с учетом safe area */
        .mobile-dialog-height {
          height: 100dvh;
          max-height: 100dvh;
        }
        
        /* Контент с отступом для footer */
        .mobile-dialog-content {
          padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
        }
      }
      
      /* Поддержка iPhone X и новее */
      @supports (padding: max(0px)) {
        @media (max-width: 768px) {
          .safe-area-bottom {
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
          }
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};
