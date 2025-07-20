
import * as React from "react"

const MOBILE_BREAKPOINT = 768 // Corresponds to Tailwind's `md` breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      setIsMobile(false);
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(mql.matches)
    }

    mql.addEventListener("change", onChange)
    // Set initial value
    onChange();

    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile;
}
