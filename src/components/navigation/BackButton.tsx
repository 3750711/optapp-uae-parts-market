import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { getCommonTranslations } from "@/utils/translations/common";

interface BackButtonProps {
  className?: string;
  label?: string;
  fallback?: string;
  to?: string; // Explicit navigation path instead of browser history
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

const BackButton: React.FC<BackButtonProps> = ({
  className,
  label,
  fallback = "/",
  to,
  variant = "ghost",
  size = "sm",
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const commonT = getCommonTranslations(language);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const buttonLabel = label || commonT.buttons.back;

  const handleBack = useCallback(() => {
    if (isNavigating) return; // Prevent double clicks
    
    setIsNavigating(true);
    
    try {
      // If explicit 'to' path is provided, use it instead of browser history
      if (to) {
        navigate(to);
      } else {
        navigate(-1);
      }
    } catch (e) {
      navigate(fallback);
    } finally {
      // Reset after navigation completes
      setTimeout(() => setIsNavigating(false), 500);
    }
  }, [isNavigating, navigate, fallback, to]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleBack}
      disabled={isNavigating}
      className={`inline-flex items-center ${className || ""}`}
      aria-label={buttonLabel}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{buttonLabel}</span>
    </Button>
  );
};

export default BackButton;
