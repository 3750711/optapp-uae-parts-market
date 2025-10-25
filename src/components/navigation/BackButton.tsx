import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { getCommonTranslations } from "@/utils/translations/common";

interface BackButtonProps {
  className?: string;
  label?: string;
  fallback?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

const BackButton: React.FC<BackButtonProps> = ({
  className,
  label,
  fallback = "/",
  variant = "ghost",
  size = "sm",
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const commonT = getCommonTranslations(language);
  
  const buttonLabel = label || commonT.buttons.back;

  const handleBack = () => {
    try {
      // React Router handles history navigation automatically
      navigate(-1);
    } catch (e) {
      // Fallback only if navigation fails
      navigate(fallback);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleBack}
      className={`inline-flex items-center ${className || ""}`}
      aria-label={buttonLabel}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{buttonLabel}</span>
    </Button>
  );
};

export default BackButton;
