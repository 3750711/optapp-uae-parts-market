
import React from "react";
import { HelpCircle } from "lucide-react";

export const SellerHelpSection: React.FC = () => {
  return (
    <div className="space-y-3 text-sm mt-4">
      <div className="flex items-center text-gray-700">
        <HelpCircle className="h-5 w-5 mr-2 text-optapp-yellow" />
        <a 
          href="https://t.me/ElenaOPTcargo" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-primary hover:underline transition-colors"
        >
          Спросить у администратора
        </a>
      </div>
    </div>
  );
};
