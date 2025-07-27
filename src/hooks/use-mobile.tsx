
import * as React from "react"

const MOBILE_BREAKPOINT = 768 // Corresponds to Tailwind's `md` breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Initialize with proper server-side value to prevent hydration issues
    if (typeof window === 'undefined') return false;
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    return mql.matches;
  });
  const [isStable, setIsStable] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setIsMobile(false);
      setIsStable(true);
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(mql.matches)
    }

    // Stabilize after initial render
    const stabilizeTimer = setTimeout(() => {
      setIsStable(true);
    }, 100);

    mql.addEventListener("change", onChange)
    // Set initial value
    onChange();

    return () => {
      mql.removeEventListener("change", onChange);
      clearTimeout(stabilizeTimer);
    };
  }, [])

  // Return stable value only after stabilization
  return isStable ? isMobile : false;
}
