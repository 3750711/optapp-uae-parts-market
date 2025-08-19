export interface LifecycleOptions {
  onVisibilityChange?: (isHidden: boolean) => void;
  onPageHide?: () => void;
  onPageShow?: (event: PageTransitionEvent) => void;
  onFreeze?: () => void;
  onResume?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  enableBfcacheOptimization?: boolean;
  debounceDelay?: number;
  skipFastSwitching?: boolean;
}