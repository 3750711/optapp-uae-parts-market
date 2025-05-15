
import { useState, useEffect } from 'react';

export function useIntersection(
  elementRef: React.RefObject<Element>,
  rootMargin: string = '0px'
): boolean {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, rootMargin]);

  return isIntersecting;
}
