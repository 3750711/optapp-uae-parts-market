import React from 'react';
import { Check, Edit3, Camera } from 'lucide-react';

const SignedProductExampleCard: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Example of signed product photo
      </h3>
      
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Example image */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <div className="relative w-48 h-48 bg-card border-2 border-border rounded-lg shadow-lg overflow-hidden">
            <img 
              src="/examples/example_signed_product.png" 
              alt="Example of signed product with buyer details"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image doesn't load
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'flex';
                }
              }}
            />
            {/* Fallback content */}
            <div className="hidden bg-muted/50 h-full rounded-lg flex-col justify-center items-center text-xs text-muted-foreground p-4">
              <Camera className="h-8 w-8 mb-2 opacity-50" />
              <div className="text-center">
                <div className="font-mono font-medium mb-1 text-blue-600">[ВАШ OPT ID]</div>
                <div className="font-mono font-medium text-green-600">[НОМЕР ЗАКАЗА]</div>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements list */}
        <div className="flex-1 space-y-3">
          <div className="flex items-start gap-2">
            <Edit3 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-foreground">Write on the part</span>
              <p className="text-muted-foreground text-xs mt-1">
                Use a marker or pen to write directly on the product
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-foreground">Buyer OPT ID</span>
              <p className="text-muted-foreground text-xs mt-1">
                Write the <span className="font-mono font-medium text-blue-600">[ВАШ OPT ID]</span> clearly and large
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-foreground">Order number</span>
              <p className="text-muted-foreground text-xs mt-1">
                Include the full <span className="font-mono font-medium text-green-600">[НОМЕР ЗАКАЗА]</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Camera className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-foreground">Clear and readable</span>
              <p className="text-muted-foreground text-xs mt-1">
                Make sure the text is large enough to read clearly
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Tip:</span> Use a permanent marker for dark parts 
          or white correction fluid/tape for light colored parts to ensure good contrast when writing the 
          <span className="font-mono font-medium text-blue-600 mx-1">[ВАШ OPT ID]</span> and 
          <span className="font-mono font-medium text-green-600 mx-1">[НОМЕР ЗАКАЗА]</span>.
        </p>
      </div>
    </div>
  );
};

export default SignedProductExampleCard;