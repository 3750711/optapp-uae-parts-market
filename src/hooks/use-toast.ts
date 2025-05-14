
import { useState } from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export const useToast = () => {
  const [open, setOpen] = useState(false);
  const [toastProps, setToastProps] = useState<ToastProps>({
    title: "",
    description: "",
    variant: "default",
  });

  const toast = (props: ToastProps) => {
    setToastProps(props);
    setOpen(true);
    
    // Автоматически скрываем уведомление через 3 секунды
    setTimeout(() => {
      setOpen(false);
    }, 3000);
  };

  return {
    toast,
    open,
    setOpen,
    toastProps,
  };
};

// Отдельная функция для использования без React Hooks
export const toast = (props: ToastProps) => {
  // Создаем событие для отображения уведомления
  const event = new CustomEvent("toast", { detail: props });
  document.dispatchEvent(event);
};
