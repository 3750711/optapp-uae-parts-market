import { toast as sonnerToast } from 'sonner'

// Create a unified toast API that works with both Radix-style and Sonner calls
type ToastVariant = "default" | "destructive" | "success"

interface ToastProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

export function toast(props: ToastProps | string) {
  // If it's a simple string, show as info
  if (typeof props === 'string') {
    sonnerToast(props);
    return;
  }

  const { title, description, variant = 'default' } = props;
  const message = title || description || '';
  
  switch (variant) {
    case 'destructive':
      sonnerToast.error(message);
      break;
    case 'success':
      sonnerToast.success(message);
      break;
    default:
      sonnerToast(message);
      break;
  }
}

// Add direct access to sonner methods
toast.success = sonnerToast.success;
toast.error = sonnerToast.error;
toast.info = sonnerToast.info;
toast.warning = sonnerToast.warning;

// Provide useToast hook for compatibility with existing code
export function useToast() {
  return {
    toast,
    toasts: [],
    dismiss: () => {},
    clear: () => {}
  }
}