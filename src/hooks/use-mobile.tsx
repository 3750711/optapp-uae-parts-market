
import * as React from "react"

const MOBILE_BREAKPOINT = 768 // Corresponds to Tailwind's `md` breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isStable, setIsStable] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setIsMobile(false);
      setIsStable(true);
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(mql.matches)
      
      // Add stability timer to prevent rapid changes
      setTimeout(() => {
        setIsStable(true);
      }, 100);
    }

    mql.addEventListener("change", onChange)
    // Set initial value
    onChange();

    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return stable value only after stabilization
  return isStable ? isMobile : false;
}
