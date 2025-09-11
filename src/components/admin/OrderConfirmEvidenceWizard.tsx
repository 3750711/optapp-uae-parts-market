import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { Loader2, Upload, Check, ArrowRight, ArrowLeft, Camera, FileSignature } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { useIsMobile } from "@/hooks/use-mobile";
import { SessionStatusComponent } from "./SessionStatusComponent";
import UnifiedImageUpload from "@/components/admin/order/UnifiedImageUpload";
import { useConfirmationUpload } from "./useConfirmationUpload";
import ProofExampleCard from "./sell-product/ProofExampleCard";
import SignedProductExampleCard from "./sell-product/SignedProductExampleCard";

interface OrderConfirmEvidenceWizardProps {
  open: boolean;
  orderId: string;
  onComplete: () => void;
  onCancel: () => void;
}

type StepId = 'chat_confirmation' | 'signed_product';

export const OrderConfirmEvidenceWizard: React.FC<OrderConfirmEvidenceWizardProps> = ({
  open,
  orderId,
  onComplete,
  onCancel,
}) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  // Current step state
  const [currentStep, setCurrentStep] = useState<StepId>('chat_confirmation');
  const [selectedStepOverride, setSelectedStepOverride] = useState<StepId | null>(null);
  
  // Step completion tracking
  const [step1Images, setStep1Images] = useState<string[]>([]);
  const [step2Images, setStep2Images] = useState<string[]>([]);
  const [step1Confirmed, setStep1Confirmed] = useState(false);
  const [isLoadingStepData, setIsLoadingStepData] = useState(true);

  // Fetch order data
  const { data: orderData, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order-confirm-data', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('order_number, buyer_opt_id, title, price')
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open && !!orderId,
  });

  // Get hooks for each step
  const step1Hook = useConfirmationUpload(
    open && currentStep === 'chat_confirmation', 
    orderId, 
    () => {}, // We handle completion manually
    'images-only',
    'chat_screenshot'
  );

  const step2Hook = useConfirmationUpload(
    open && currentStep === 'signed_product', 
    orderId, 
    () => {}, // We handle completion manually
    'images-only',
    'signed_product'
  );

  // Load existing data when dialog opens
  useEffect(() => {
    if (!open) return;
    
    const loadExistingData = async () => {
      setIsLoadingStepData(true);
      try {
        const [chatImages, signedImages] = await Promise.all([
          step1Hook.getImagesByCategory('chat_screenshot'),
          step2Hook.getImagesByCategory('signed_product')
        ]);
        
        setStep1Images(chatImages);
        setStep2Images(signedImages);
        
        // For non-admin users: Auto-advance to step 2 if step 1 is completed
        if (profile?.user_type !== 'admin' && chatImages.length > 0 && signedImages.length === 0) {
          setCurrentStep('signed_product');
        }
        
        // For admin users: use override or default to first step
        if (profile?.user_type === 'admin') {
          setCurrentStep(selectedStepOverride || 'chat_confirmation');
        }
      } catch (error) {
        console.error('Error loading existing data:', error);
      } finally {
        setIsLoadingStepData(false);
      }
    };

    loadExistingData();
  }, [open, step1Hook.getImagesByCategory, step2Hook.getImagesByCategory]);

  // Update step images when uploads change
  useEffect(() => {
    if (currentStep === 'chat_confirmation') {
      setStep1Images(step1Hook.confirmImages);
    } else if (currentStep === 'signed_product') {
      setStep2Images(step2Hook.confirmImages);
    }
  }, [currentStep, step1Hook.confirmImages, step2Hook.confirmImages]);

  // Define steps
  const steps: Array<{
    id: string;
    label: string;
    description: string;
    status: 'pending' | 'current' | 'completed';
  }> = [
    {
      id: 'chat_confirmation',
      label: 'Chat Screenshot',
      description: 'Upload confirmation',
      status: step1Images.length > 0 ? 'completed' : (currentStep === 'chat_confirmation' ? 'current' : 'pending')
    },
    {
      id: 'signed_product',
      label: 'Signed Product',
      description: 'Upload photo',
      status: step2Images.length > 0 ? 'completed' : (currentStep === 'signed_product' ? 'current' : 'pending')
    }
  ];

  const currentHook = currentStep === 'chat_confirmation' ? step1Hook : step2Hook;
  const canProceedStep1 = step1Images.length > 0 && step1Confirmed;
  const canProceedStep2 = step2Images.length > 0;
  const canSaveCurrentStep = currentStep === 'chat_confirmation' ? canProceedStep1 : canProceedStep2;

  // Step navigation
  const handleNext = useCallback(async () => {
    if (currentStep === 'chat_confirmation' && canProceedStep1) {
      // Save step 1 and move to step 2
      try {
        await step1Hook.handleSaveMedia();
        toast.success('Chat screenshot saved successfully');
        setCurrentStep('signed_product');
      } catch (error) {
        toast.error('Failed to save chat screenshot');
      }
    }
  }, [currentStep, canProceedStep1, step1Hook]);

  const handleFinish = useCallback(async () => {
    if (currentStep === 'signed_product' && canProceedStep2) {
      try {
        await step2Hook.handleSaveMedia();
        toast.success('Evidence uploaded successfully');
        onComplete();
      } catch (error) {
        toast.error('Failed to save signed product photo');
      }
    }
  }, [currentStep, canProceedStep2, step2Hook, onComplete]);

  const handleSkip = useCallback(() => {
    if (currentStep === 'signed_product') {
      toast.success('Second step skipped. You can upload signed product photos later.');
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handleBack = useCallback(() => {
    if (currentStep === 'signed_product') {
      setCurrentStep('chat_confirmation');
    }
  }, [currentStep]);

  // Prevent accidental closing during upload
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (step1Hook.isUploading || step2Hook.isUploading)) {
      return;
    }
    if (!newOpen) {
      onCancel();
    }
  };

  const AdminTypeSelector = () => {
    if (profile?.user_type !== 'admin') return null;
    
    return (
      <div className="border-b pb-4 mb-4">
        <h3 className="text-sm font-medium mb-3">Select Upload Type</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selectedStepOverride === 'chat_confirmation' ? 'default' : 'outline'}
            onClick={() => {
              setSelectedStepOverride('chat_confirmation');
              setCurrentStep('chat_confirmation');
            }}
            className="relative h-auto p-4 flex flex-col items-start text-left"
          >
            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </div>
            <Camera className="h-5 w-5 mb-2 text-blue-500" />
            <div className="font-medium">Chat Screenshots</div>
            <div className="text-xs text-muted-foreground mt-1">
              {step1Images.length > 0 ? `${step1Images.length} uploaded` : 'Not uploaded'}
            </div>
          </Button>
          
          <Button
            variant={selectedStepOverride === 'signed_product' ? 'default' : 'outline'}
            onClick={() => {
              setSelectedStepOverride('signed_product');
              setCurrentStep('signed_product');
            }}
            className="relative h-auto p-4 flex flex-col items-start text-left"
          >
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </div>
            <FileSignature className="h-5 w-5 mb-2 text-green-500" />
            <div className="font-medium">Signed Product</div>
            <div className="text-xs text-muted-foreground mt-1">
              {step2Images.length > 0 ? `${step2Images.length} uploaded` : 'Not uploaded'}
            </div>
          </Button>
        </div>
      </div>
    );
  };

  const StepContent = () => {
    if (isLoadingStepData) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Admin Type Selector */}
        <AdminTypeSelector />
        
        {/* Order Information for Labeling - Always shown at top */}
        {!isLoadingOrder && orderData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <h3 className="font-bold text-yellow-800 mb-3 text-sm sm:text-base">
              LABEL THE SOLD PRODUCT:
            </h3>
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-2 sm:p-3 border-2 border-yellow-300">
                <div className="text-yellow-700 font-medium text-xs sm:text-sm">BUYER'S OPT ID:</div>
                <div className="font-bold text-yellow-900 tracking-wider text-lg sm:text-2xl">
                  {orderData.buyer_opt_id?.toUpperCase() || 'NOT SPECIFIED'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 sm:p-3 border-2 border-yellow-300">
                <div className="text-yellow-700 font-medium text-xs sm:text-sm">ORDER NUMBER:</div>
                <div className="font-bold text-yellow-900 tracking-wider text-lg sm:text-2xl">
                  #{orderData.order_number || 'NOT SPECIFIED'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 sm:p-3 border-2 border-yellow-300">
                <div className="text-yellow-700 font-medium text-xs sm:text-sm">PRODUCT NAME:</div>
                <div className="font-bold text-yellow-900 text-base sm:text-lg truncate">
                  {orderData.title || 'NOT SPECIFIED'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 sm:p-3 border-2 border-yellow-300">
                <div className="text-yellow-700 font-medium text-xs sm:text-sm">PRICE:</div>
                <div className="font-bold text-yellow-900 tracking-wider text-lg sm:text-2xl">
                  ${Number(orderData.price || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoadingOrder && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-yellow-700">Loading order information...</span>
            </div>
          </div>
        )}

        <SessionStatusComponent
          isComponentReady={currentHook.isComponentReady}
          sessionLost={currentHook.sessionLost}
          uploadError={currentHook.uploadError}
          onSessionRecovery={currentHook.handleSessionRecovery}
          onReset={currentHook.handleReset}
          isSeller={profile?.user_type === 'seller'}
        />

        {currentHook.isComponentReady && !currentHook.sessionLost && (
          <>
            {/* Step 1: Chat Confirmation */}
            {currentStep === 'chat_confirmation' && (
              <div className="space-y-4">
                <ProofExampleCard />
                
                {/* Chat Screenshots Upload */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Upload Purchase Confirmation Screenshot</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a screenshot of your chat (WhatsApp/Telegram) where the buyer clearly confirms the purchase (e.g., "ok, i will buy"). Make sure date/time and the buyer's name are visible.
                  </p>
                </div>

                <UnifiedImageUpload
                  images={step1Hook.confirmImages}
                  onImagesUpload={step1Hook.handleImagesUpload}
                  onImageDelete={step1Hook.handleImageDelete}
                  maxImages={8}
                  disabled={!currentHook.isComponentReady || currentHook.sessionLost}
                />

                {step1Hook.confirmImages.length > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="chat-confirmation"
                        checked={step1Confirmed}
                        onCheckedChange={(checked) => setStep1Confirmed(checked === true)}
                      />
                      <label 
                        htmlFor="chat-confirmation"
                        className="text-sm text-orange-700 leading-relaxed cursor-pointer"
                      >
                        I confirm that the screenshot shows the buyer's clear consent (e.g., "ok, i will buy").
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Signed Product */}
            {currentStep === 'signed_product' && (
              <div className="space-y-4">
                <SignedProductExampleCard />
                
                {/* Signed Product Upload */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Upload Signed Product Photo</h3>
                  <p className="text-sm text-muted-foreground">
                    Write the BUYER OPT ID and ORDER NUMBER shown above on the product. Make it large and readable.
                  </p>
                </div>

                <UnifiedImageUpload
                  images={step2Hook.confirmImages}
                  onImagesUpload={step2Hook.handleImagesUpload}
                  onImageDelete={step2Hook.handleImageDelete}
                  maxImages={8}
                  disabled={!currentHook.isComponentReady || currentHook.sessionLost}
                />

                {/* Show step 1 is locked if not completed */}
                {step1Images.length === 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      Please complete step 1 (Chat Screenshot) first before uploading signed product photos.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const ActionButtons = () => {
    // For admin with specific step override, show Save & Close button
    if (profile?.user_type === 'admin' && selectedStepOverride) {
      return (
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedStepOverride(null);
              setCurrentStep('chat_confirmation');
            }}
            disabled={currentHook.isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                await currentHook.handleSaveMedia();
                toast.success(`${selectedStepOverride === 'chat_confirmation' ? 'Chat screenshots' : 'Signed product photos'} saved successfully`);
                onComplete();
              } catch (error) {
                toast.error('Failed to save');
              }
            }}
            disabled={!canSaveCurrentStep || currentHook.isUploading}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 flex-1"
          >
            {currentHook.isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save & Close
              </>
            )}
          </Button>
        </div>
      );
    }
    
    // Regular flow for non-admin or admin without override
    return (
      <div className="flex gap-2 w-full">
        {/* Back button */}
        {currentStep === 'signed_product' && (
          <Button 
            variant="outline"
            onClick={handleBack}
            disabled={currentHook.isUploading}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}

        {/* Next/Finish button */}
        {currentStep === 'chat_confirmation' ? (
          <Button
            onClick={handleNext}
            disabled={!canSaveCurrentStep || currentHook.isUploading}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 flex-1"
          >
            {currentHook.isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save & Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <div className="flex gap-2 flex-1">
            <Button
              onClick={handleSkip}
              variant="outline"
              disabled={currentHook.isUploading || step1Images.length === 0}
              className="flex items-center gap-2"
            >
              Skip Later
            </Button>
            <Button
              onClick={handleFinish}
              disabled={!canSaveCurrentStep || currentHook.isUploading || step1Images.length === 0}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2 flex-1"
            >
              {currentHook.isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Finish
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[calc(100vh-2rem)] h-[calc(100dvh-2rem)] w-full flex flex-col p-0"
          onInteractOutside={(e) => {
            if (step1Hook.isUploading || step2Hook.isUploading) {
              e.preventDefault();
            }
          }}
        >
          <SheetHeader className="text-left p-4 pb-2 border-b">
            <SheetTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Confirmation Evidence ({currentStep === 'chat_confirmation' ? '1' : '2'}/2)
            </SheetTitle>
            <SheetDescription className="text-sm">
              Upload evidence to confirm order completion
            </SheetDescription>
          </SheetHeader>

          {/* Stepper - hidden for admin with specific override */}
          {!(profile?.user_type === 'admin' && selectedStepOverride) && (
            <div className="px-4 py-3 border-b">
              <Stepper steps={steps} />
            </div>
          )}
          
          <div className="flex-1 px-4 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [@supports(-webkit-touch-callout:none)]:[-webkit-overflow-scrolling:touch]">
            <div className="py-2">
              <StepContent />
            </div>
          </div>
          
          <SheetFooter className="p-4 pt-3 border-t bg-white">
            <ActionButtons />
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            Order Confirmation Evidence - Step {currentStep === 'chat_confirmation' ? '1' : '2'} of 2
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Upload evidence to confirm order completion
          </DialogDescription>
        </DialogHeader>

        {/* Stepper - hidden for admin with specific override */}
        {!(profile?.user_type === 'admin' && selectedStepOverride) && (
          <div className="px-3 sm:px-6 py-4 border-b flex-shrink-0">
            <Stepper steps={steps} />
          </div>
        )}

        <div className="flex-1 px-3 sm:px-6 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [@supports(-webkit-touch-callout:none)]:[-webkit-overflow-scrolling:touch]">
          <div className="py-2">
            <StepContent />
          </div>
        </div>

        <DialogFooter className="px-3 sm:px-6 pt-4 pb-3 sm:pb-6 border-t flex-shrink-0 bg-white">
          <ActionButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};