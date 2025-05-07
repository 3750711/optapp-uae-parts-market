
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster 
      position="bottom-right"
      toastOptions={{
        className: "border text-foreground rounded-md",
        classNames: {
          error: "border-red-600",
          success: "border-green-600",
        }
      }}
    />
  );
}
