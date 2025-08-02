import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AccountTypeStepProps {
  onSelectType: (type: 'buyer' | 'seller') => void;
  onBack: () => void;
  translations: any;
}

export const AccountTypeStep: React.FC<AccountTypeStepProps> = ({
  onSelectType,
  onBack,
  translations
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {translations.chooseAccountType}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
              onClick={() => onSelectType('buyer')}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {translations.buyerAccount}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {translations.buyerDescription}
                </p>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              onClick={(e) => {
                e.stopPropagation();
                onSelectType('buyer');
              }}
            >
              {translations.buyerAccount}
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
              onClick={() => onSelectType('seller')}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {translations.sellerAccount}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {translations.sellerDescription}
                </p>
              </div>
            </div>
            
            <Button 
              className="w-full mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              onClick={(e) => {
                e.stopPropagation();
                onSelectType('seller');
              }}
            >
              {translations.sellerAccount}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack}>
          {translations.back}
        </Button>
      </div>
    </div>
  );
};