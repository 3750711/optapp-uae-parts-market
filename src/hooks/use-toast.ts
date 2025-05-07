
import { toast as sonnerToast } from "sonner";
import * as React from "react";

export type ToastProps = React.ComponentPropsWithoutRef<typeof sonnerToast>;

export type ToastActionElement = React.ReactElement<unknown>;

export type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive" | "success";
};

export const useToast = () => {
  const toast = ({ variant, title, description, ...props }: ToasterToast) => {
    return sonnerToast(title as string, {
      description,
      ...props,
      className: cn({
        "border-red-600": variant === "destructive",
        "border-green-600": variant === "success",
      }),
    });
  };

  return {
    toast,
  };
};

const cn = (...inputs: any[]) => {
  return inputs
    .filter(Boolean)
    .join(" ")
    .trim();
};

// Function to notify Telegram about new products
export const notifyTelegramAboutNewProduct = async (product: any) => {
  try {
    const response = await fetch('https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error sending Telegram notification:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
};

// Export toast as a convenience function
export const toast = (props: ToasterToast) => {
  const { toast: toastFn } = useToast();
  return toastFn(props);
};
