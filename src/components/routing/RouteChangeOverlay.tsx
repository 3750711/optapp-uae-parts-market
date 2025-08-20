import * as React from "react";
import { useLocation } from "react-router-dom";
import { PBLogoLoader } from "@/components/ui/PBLogoLoader";

export function RouteChangeOverlay({ delay = 350 }: { delay?: number }) {
  const location = useLocation();
  const [busy, setBusy] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  React.useEffect(() => {
    // включаем оверлей на короткое время при смене локации
    setBusy(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBusy(false), delay);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [location.key, delay]);

  if (!busy) return null;
  return <PBLogoLoader />;
}