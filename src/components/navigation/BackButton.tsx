import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  className?: string;
  label?: string;
  fallback?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

const BackButton: React.FC<BackButtonProps> = ({
  className,
  label = "Назад",
  fallback = "/",
  variant = "ghost",
  size = "sm",
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    try {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallback);
      }
    } catch (e) {
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
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
};

export default BackButton;
