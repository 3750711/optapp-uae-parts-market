
import * as React from "react";
import { v4 as uuidv4 } from 'uuid';

export type ToastActionElement = React.ReactElement<HTMLButtonElement>;

export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
};

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 3000;

type ToasterToast = ToastProps & {
  id: string;
  visible: boolean;
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ToastContextType = {
  toasts: ToasterToast[];
  addToast: (props: ToastProps) => void;
  removeToast: (id: string) => void;
  updateToast: (id: string, props: ToastProps) => void;
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([]);

  const addToast = React.useCallback(
    (props: ToastProps) => {
      setToasts((prevToasts) => {
        const id = props.id || uuidv4();
        const newToast = {
          ...props,
          id,
          visible: true,
        };

        // Limit the maximum number of toasts
        const updatedToasts = [
          newToast,
          ...prevToasts.slice(0, TOAST_LIMIT - 1),
        ];

        return updatedToasts;
      });
      
      setTimeout(() => {
        setToasts((prevToasts) => 
          prevToasts.filter(toast => toast.id !== (props.id || uuidv4()))
        );
      }, TOAST_REMOVE_DELAY);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = React.useCallback(
    (id: string, props: ToastProps) => {
      setToasts((prevToasts) =>
        prevToasts.map((toast) =>
          toast.id === id ? { ...toast, ...props } : toast
        )
      );
    },
    []
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        updateToast,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const toast = (props: ToastProps) => {
    context.addToast(props);
  };

  return {
    toast,
    toasts: context.toasts,
    dismissToast: context.removeToast,
    updateToast: context.updateToast,
  };
}

// For using outside of React components
export const toast = (props: ToastProps) => {
  const event = new CustomEvent("toast", { detail: props });
  document.dispatchEvent(event);
};
