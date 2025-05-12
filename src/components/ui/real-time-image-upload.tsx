
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { processImageForUpload, uploadProcessedImage, logImageProcessing } from "@/utils/imageProcessingUtils";
import { isImage } from "@/utils/imageCompression";

interface RealtimeImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxImages?: number;
  storageBucket: string;
  storagePath?: string;
}

export function RealtimeImageUpload({
  onUploadComplete,
  maxImages = 10,
  storageBucket,
  storagePath = "",
}: RealtimeImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Check if device is mobile
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Ensure preview generation after upload
  const triggerPreviewGeneration = useCallback(async (productId?: string) => {
    try {
      logImageProcessing('TriggerPreview', { 
        productId: productId || 'unknown'
      });
      
      const { data, error } = await supabase.functions.invoke('generate-preview', {
        body: { 
          action: productId ? 'process_product' : 'process_batch',
          productId,
          batchSize: 10
        }
      });
      
      if (error) {
        logImageProcessing('TriggerPreviewError', { error: error.message });
        console.error("Error generating previews:", error);
      } else {
        logImageProcessing('TriggerPreviewSuccess', { response: data });
        console.log("Preview generation triggered:", data);
      }
    } catch (err) {
      console.error("Failed to generate previews:", err);
      logImageProcessing('TriggerPreviewException', { 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }, []);

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      const newUploadProgress: Record<string, number> = {};
      const fileIds = Array.from(files).map((_, idx) => `file-${Date.now()}-${idx}`);
      
      fileIds.forEach(id => {
        newUploadProgress[id] = 0;
      });
      
      setUploadProgress(newUploadProgress);
      
      const newUrls: string[] = [];
      
      logImageProcessing('RealtimeUploadStart', { fileCount: files.length, bucket: storageBucket });
      
      for (let i = 0; i < files.length; i++) {
        const fileId = fileIds[i];
        const file = files[i];
        
        // Update progress
        newUploadProgress[fileId] = 10;
        setUploadProgress({...newUploadProgress});
        
        // Check file size (max 25MB)
        if (file.size > 25 * 1024 * 1024) {
          toast({
            title: "Error",
            description: `File ${file.name} is too large. Maximum size is 25MB`,
            variant: "destructive",
          });
          
          newUploadProgress[fileId] = -1; // Mark as error
          setUploadProgress({...newUploadProgress});
          continue;
        }
        
        // Check file type
        if (!isImage(file)) {
          toast({
            title: "Error",
            description: `File ${file.name} is not an image`,
            variant: "destructive",
          });
          
          newUploadProgress[fileId] = -1; // Mark as error
          setUploadProgress({...newUploadProgress});
          continue;
        }
        
        try {
          // Process image (optimize and create preview)
          newUploadProgress[fileId] = 25;
          setUploadProgress({...newUploadProgress});
          
          const processed = await processImageForUpload(file);
          
          // Update progress
          newUploadProgress[fileId] = 50;
          setUploadProgress({...newUploadProgress});
          
          // Upload to Supabase storage with unified helper
          const { originalUrl, previewUrl } = await uploadProcessedImage(
            processed,
            storageBucket,
            storagePath
          );
          
          // Log success with preview information
          logImageProcessing('RealtimeUploadSuccess', {
            originalUrl,
            hasPreview: !!previewUrl,
            previewUrl
          });
          
          newUrls.push(originalUrl);
          
          // Update progress
          newUploadProgress[fileId] = 100;
          setUploadProgress({...newUploadProgress});
        } catch (error) {
          logImageProcessing('RealtimeUploadError', {
            fileName: file.name,
            error: error instanceof Error ? error.message : String(error)
          });
          
          newUploadProgress[fileId] = -1; // Mark as error
          setUploadProgress({...newUploadProgress});
          
          toast({
            title: "Error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
        }
      }

      if (newUrls.length > 0) {
        onUploadComplete(newUrls);
        
        toast({
          title: "Success",
          description: `Uploaded ${newUrls.length} image${newUrls.length > 1 ? 's' : ''}`,
        });
        
        // Trigger preview generation as a fallback
        triggerPreviewGeneration();
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }, [onUploadComplete, storageBucket, storagePath, triggerPreviewGeneration]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {/* Upload progress indicators */}
        {Object.entries(uploadProgress).map(([id, progress]) => (
          progress !== 100 && progress !== -1 && (
            <div key={id} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">{progress}%</span>
              </div>
            </div>
          )
        ))}
        
        {/* Upload buttons */}
        <div 
          className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-6 w-6 text-gray-400" />
          <p className="text-xs text-gray-500 mt-1">Upload</p>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={isUploading}
      />
      
      {isMobile() && (
        <input
          type="file"
          ref={cameraInputRef}
          multiple
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleUpload}
          disabled={isUploading}
        />
      )}
      
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          className="flex items-center gap-1"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-3 w-3" />
              <span>From Gallery</span>
            </>
          )}
        </Button>
        
        {isMobile() && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="flex items-center gap-1"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-3 w-3" />
            <span>Take Photo</span>
          </Button>
        )}
      </div>
    </div>
  );
}
