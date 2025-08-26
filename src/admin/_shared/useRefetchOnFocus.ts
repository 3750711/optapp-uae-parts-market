import { useEffect, useRef } from "react";

export function useRefetchOnFocus(cb: () => void, throttleMs = 600) {
  const last = useRef(0);
  
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - last.current < throttleMs) return;
      last.current = now;
      cb(); // просто перезапрос данных, без перезагрузки страницы
    };
    
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [cb, throttleMs]);
}