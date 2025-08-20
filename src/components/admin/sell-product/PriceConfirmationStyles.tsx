import React from 'react';

export const PriceConfirmationStyles = () => {
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Price Confirmation Dialog Optimizations */
      .price-confirmation-dialog {
        /* Cross-browser safe area support */
        padding-top: max(1rem, env(safe-area-inset-top, 0px));
        padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
        padding-left: max(1rem, env(safe-area-inset-left, 0px));
        padding-right: max(1rem, env(safe-area-inset-right, 0px));
      }

      /* Enhanced touch targets for mobile */
      .price-confirmation-dialog .touch-target {
        min-height: 44px;
        min-width: 44px;
        touch-action: manipulation;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }

      /* Improved input styling for number inputs */
      .touch-optimized-input[type="number"] {
        -moz-appearance: textfield;
        -webkit-appearance: none;
        appearance: none;
      }

      .touch-optimized-input[type="number"]::-webkit-outer-spin-button,
      .touch-optimized-input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Enhanced focus states for accessibility */
      .touch-optimized-input:focus {
        box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
        border-color: hsl(var(--primary));
      }

      /* Keyboard visibility adjustments */
      @media (max-width: 768px) {
        .keyboard-visible {
          transform: translateX(-50%) !important;
          -webkit-transform: translateX(-50%) !important;
        }

        .safe-area-insets {
          padding-bottom: max(0.5rem, env(safe-area-inset-bottom, 0px));
        }

        /* iOS specific optimizations */
        @supports (-webkit-touch-callout: none) {
          .price-confirmation-dialog {
            /* Fix for iOS Safari bottom safe area */
            padding-bottom: max(1rem, constant(safe-area-inset-bottom));
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
          }

          .touch-optimized-input {
            /* Prevent iOS zoom on focus */
            font-size: 16px;
            line-height: 1.4;
          }
        }

        /* Android Chrome optimizations */
        @media (-webkit-device-pixel-ratio: 2) and (orientation: portrait) {
          .keyboard-visible {
            max-height: calc(100vh - 320px);
          }
        }
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .touch-optimized-input {
          border-width: 2px;
        }

        .touch-optimized-input:focus {
          outline: 2px solid;
          outline-offset: 2px;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .price-confirmation-dialog * {
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
        }
      }

      /* Dark mode enhancements */
      @media (prefers-color-scheme: dark) {
        .price-confirmation-dialog {
          /* Enhanced contrast for dark mode */
          color-scheme: dark;
        }
      }

      /* Print styles */
      @media print {
        .price-confirmation-dialog {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return null;
};