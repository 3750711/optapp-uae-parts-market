import React from 'react';
import { Check, Clock, User } from 'lucide-react';

const ProofExampleCard: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Example of required screenshot
      </h3>
      
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Phone mockup */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <div className="relative w-48 h-64 bg-card border-2 border-border rounded-3xl shadow-lg overflow-hidden">
            {/* Phone frame */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-muted-foreground/30 rounded-full"></div>
            
            {/* Screen content */}
            <div className="mt-6 px-3 h-full">
              <img 
                src="/examples/chat-proof-example.png" 
                alt="Purchase confirmation chat example"
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  // Fallback if image doesn't load
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'block';
                  }
                }}
              />
              {/* Fallback content */}
              <div className="hidden bg-muted/50 h-full rounded-lg flex flex-col justify-center items-center text-xs text-muted-foreground p-2">
                <div className="bg-primary/10 text-primary px-2 py-1 rounded-lg mb-2">
                  "ok, i will buy"
                </div>
                <div className="text-xs opacity-60">12:34 PM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements list */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-foreground">Buyer's confirmation text</span>
              <p className="text-muted-foreground text-xs mt-1">
                Clear agreement like "ok, i will buy", "yes, I'll take it", etc.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-foreground">Date and time visible</span>
              <p className="text-muted-foreground text-xs mt-1">
                Message timestamp should be clearly shown
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-foreground">Buyer's name/contact</span>
              <p className="text-muted-foreground text-xs mt-1">
                Contact name or phone number should be visible
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Tip:</span> You can blur personal phone numbers if needed, 
          but keep the buyer's name and confirmation message clearly visible.
        </p>
      </div>
    </div>
  );
};

export default ProofExampleCard;