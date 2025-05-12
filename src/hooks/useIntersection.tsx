
import { useEffect, useState, useRef } from "react";

export const useIntersection = (
  element: React.RefObject<HTMLElement>,
  rootMargin: string = "0px"
): boolean => {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Clean up previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Safely create observer only in browser environment
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      // Create new observer
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          // Update state when intersection status changes
          setIsVisible(entry.isIntersecting);
        },
        { 
          rootMargin, 
          threshold: 0.1 // Added threshold to make detection more reliable
        }
      );

      const currentElement = element?.current;

      // Start observing if element exists
      if (currentElement) {
        observerRef.current.observe(currentElement);
      }
    }

    // Clean up on component unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [element, rootMargin]);

  return isVisible;
};
