
import { useEffect, useState } from "react";

export const useIntersection = (
  element: React.RefObject<HTMLElement>,
  rootMargin: string = "0px"
): boolean => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin }
    );

    const currentElement = element?.current;

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [element, rootMargin]);

  return isVisible;
};
