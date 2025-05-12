
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { forceUpdateProductPreviews, checkAndRepairPreviewUrls, verifyProductPreviewGeneration, logImageProcessing } from "@/utils/imageProcessingUtils";

export default function ProductPreviewUpdater() {
  const [productId, setProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // State for system status
  const [systemStatus, setSystemStatus] = useState<{
    missingPreviews: number;
    totalImages: number;
    checking: boolean;
  }>({
    missingPreviews: 0,
    totalImages: 0,
    checking: false
  });

  // Track async tasks
  const [taskStatus, setTaskStatus] = useState<{
    repairing: boolean;
    forcing: boolean;
    verifying: boolean;
  }>({
    repairing: false,
    forcing: false,
    verifying: false
  });

  // When the component mounts, check system status
  useEffect(() => {
    checkSystemStatus();
  }, []);

  // Function to check overall preview status
  const checkSystemStatus = async () => {
    try {
      setSystemStatus(prev => ({ ...prev, checking: true }));

      const { data: missingData, error: countError } = await supabase
        .from('product_images')
        .select('id', { count: 'exact' })
        .is('preview_url', null);

      const { data: totalData, error: totalError } = await supabase
        .from('product_images')
        .select('id', { count: 'exact' });

      setSystemStatus({
        missingPreviews: missingData?.length || 0,
        totalImages: totalData?.length || 0,
        checking: false
      });

      if (countError || totalError) {
        console.error("Error checking system status:", countError || totalError);
      }
    } catch (error) {
      console.error("Failed to check system status:", error);
      setSystemStatus(prev => ({ ...prev, checking: false }));
    }
  };

  // Function to check and update a specific product
  const checkAndUpdateProduct = async () => {
    if (!productId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // First verify the product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, title, has_preview')
        .eq('id', productId.trim())
        .single();

      if (productError || !product) {
        setLoading(false);
        toast({
          title: "Error",
          description: "Product not found",
          variant: "destructive"
        });
        return;
      }

      // Check the product images
      const { data: imageData, error: imageError } = await supabase
        .from('product_images')
        .select('id, url, preview_url')
        .eq('product_id', productId);

      if (imageError) {
        throw imageError;
      }

      // Log the initial state
      logImageProcessing('Admin:PreviewCheck', {
        productId,
        totalImages: imageData?.length || 0,
        imagesWithPreview: imageData?.filter(img => !!img.preview_url).length || 0,
        hasPreviewFlag: product.has_preview
      });

      // Call the Edge Function to generate previews
      const { data: response, error: fnError } = await supabase.functions.invoke('generate-preview', {
        body: { 
          action: 'verify_product', 
          productId: productId.trim()
        }
      });

      if (fnError) {
        throw fnError;
      }

      // Get updated state
      const { data: updatedImageData } = await supabase
        .from('product_images')
        .select('id, url, preview_url')
        .eq('product_id', productId);
        
      const { data: updatedProduct } = await supabase
        .from('products')
        .select('id, title, has_preview')
        .eq('id', productId.trim())
        .single();

      setResult({
        success: response.success,
        message: response.message,
        productTitle: product.title,
        initialState: {
          totalImages: imageData?.length || 0,
          imagesWithPreview: imageData?.filter(img => !!img.preview_url).length || 0,
          hasPreviewFlag: product.has_preview
        },
        currentState: {
          totalImages: updatedImageData?.length || 0,
          imagesWithPreview: updatedImageData?.filter(img => !!img.preview_url).length || 0,
          hasPreviewFlag: updatedProduct?.has_preview
        },
        imageDetails: updatedImageData?.map(img => ({
          id: img.id,
          url: img.url,
          hasPreview: !!img.preview_url,
          previewUrl: img.preview_url
        })) || []
      });

      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
      } else {
        toast({
          title: "Warning",
          description: response.message || "Operation completed with issues",
          variant: "default",
        });
      }

      // Refresh system status after update
      checkSystemStatus();
    } catch (error) {
      console.error("Error updating previews:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update previews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to repair preview URLs for a product
  const repairProductPreviews = async () => {
    if (!productId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product ID",
        variant: "destructive"
      });
      return;
    }

    setTaskStatus(prev => ({ ...prev, repairing: true }));

    try {
      const result = await checkAndRepairPreviewUrls(productId.trim());
      
      if (result.success) {
        toast({
          title: "Repair Complete",
          description: result.message,
        });
      } else {
        toast({
          title: "Repair Failed",
          description: result.message,
          variant: "destructive",
        });
      }
      
      // Refresh data
      checkAndUpdateProduct();
    } catch (error) {
      console.error("Error repairing previews:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to repair previews",
        variant: "destructive",
      });
    } finally {
      setTaskStatus(prev => ({ ...prev, repairing: false }));
    }
  };

  // Function to force update all previews
  const forceUpdatePreviews = async () => {
    if (!productId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product ID",
        variant: "destructive"
      });
      return;
    }

    setTaskStatus(prev => ({ ...prev, forcing: true }));

    try {
      const result = await forceUpdateProductPreviews(productId.trim());
      
      if (result.success) {
        toast({
          title: "Force Update Complete",
          description: result.message,
        });
      } else {
        toast({
          title: "Force Update Failed",
          description: result.message,
          variant: "destructive",
        });
      }
      
      setResult(prev => ({
        ...prev,
        forceUpdateDetails: result.details
      }));
      
      // Refresh data
      checkAndUpdateProduct();
    } catch (error) {
      console.error("Error forcing preview updates:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to force update previews",
        variant: "destructive",
      });
    } finally {
      setTaskStatus(prev => ({ ...prev, forcing: false }));
    }
  };

  // Function to verify database state
  const verifyDatabaseState = async () => {
    if (!productId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product ID",
        variant: "destructive"
      });
      return;
    }

    setTaskStatus(prev => ({ ...prev, verifying: true }));

    try {
      const result = await verifyProductPreviewGeneration(productId.trim());
      
      if (result.success) {
        toast({
          title: "Verification Complete",
          description: `Found ${result.imagesWithPreview} preview(s) out of ${result.totalImages} images`,
        });
        
        // If flag state is wrong, fix it
        if (result.hasPreview !== (result.imagesWithPreview > 0)) {
          toast({
            title: "Flag Mismatch Detected",
            description: "Fixed has_preview flag in database",
          });
        }
      } else {
        toast({
          title: "Verification Failed",
          description: "Could not verify product preview state",
          variant: "destructive",
        });
      }
      
      setResult(prev => ({
        ...prev,
        verificationDetails: result
      }));
      
      // Refresh data
      checkAndUpdateProduct();
    } catch (error) {
      console.error("Error verifying database state:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify database state",
        variant: "destructive",
      });
    } finally {
      setTaskStatus(prev => ({ ...prev, verifying: false }));
    }
  };

  // Run a batch job for preview generation
  const runBatchProcess = async () => {
    try {
      setLoading(true);
      
      // Check how many images need processing
      const { count: missingCount, error: countError } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true })
        .is('preview_url', null);
        
      if (countError) {
        throw countError;
      }
      
      const batchSize = 20;
      const { data: response, error: fnError } = await supabase.functions.invoke('generate-preview', {
        body: { 
          action: 'process_batch',
          batchSize 
        }
      });
      
      if (fnError) {
        throw fnError;
      }
      
      toast({
        title: "Batch Process Complete",
        description: `Processed ${response.processed} images with ${response.success} successes. ${response.remaining} remaining.`,
      });
      
      // Refresh system status
      checkSystemStatus();
    } catch (error) {
      console.error("Error running batch process:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run batch process",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Product Preview Updater</CardTitle>
        <CardDescription>
          Check and update product preview images
        </CardDescription>
        
        <div className="flex justify-between mt-2 text-sm">
          <div>
            <span className="font-medium">System Status: </span>
            {systemStatus.checking ? (
              <span className="text-gray-500">Checking...</span>
            ) : (
              <span>
                {systemStatus.missingPreviews} of {systemStatus.totalImages} images missing previews
                {systemStatus.missingPreviews > 0 && (
                  <span className="text-yellow-600 ml-1">
                    ({((systemStatus.missingPreviews / systemStatus.totalImages) * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runBatchProcess} 
            disabled={loading || systemStatus.missingPreviews === 0}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            Process Batch
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
          <Button onClick={checkAndUpdateProduct} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Check
          </Button>
        </div>
        
        {result && (
          <div className="bg-gray-50 p-4 rounded-md text-sm">
            <h3 className="font-bold mb-2">Result for: {result.productTitle}</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border rounded p-3">
                <h4 className="font-semibold text-gray-700">Initial State</h4>
                <p>Images with preview: {result.initialState.imagesWithPreview} of {result.initialState.totalImages}</p>
                <p>Has preview flag: {result.initialState.hasPreviewFlag ? 'Yes' : 'No'}</p>
              </div>
              
              <div className="border rounded p-3">
                <h4 className="font-semibold text-gray-700">Current State</h4>
                <p>Images with preview: {result.currentState.imagesWithPreview} of {result.currentState.totalImages}</p>
                <p>Has preview flag: {result.currentState.hasPreviewFlag ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div className="flex gap-2 mb-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={repairProductPreviews}
                disabled={taskStatus.repairing}
              >
                {taskStatus.repairing && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Repair URLs
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={forceUpdatePreviews}
                disabled={taskStatus.forcing}
              >
                {taskStatus.forcing && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Force Update
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                onClick={verifyDatabaseState}
                disabled={taskStatus.verifying}
              >
                {taskStatus.verifying && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Verify DB
              </Button>
            </div>
            
            <div className="overflow-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-1 text-left">Image ID</th>
                    <th className="p-1 text-left">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {result.imageDetails.map((img: any) => (
                    <tr key={img.id} className={img.hasPreview ? "" : "bg-red-50"}>
                      <td className="p-1 font-mono text-xs truncate max-w-[150px]">{img.id}</td>
                      <td className="p-1">{img.hasPreview ? "✅" : "❌"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500">
        Ensure all images have properly generated preview URLs and updated database records.
      </CardFooter>
    </Card>
  );
}
