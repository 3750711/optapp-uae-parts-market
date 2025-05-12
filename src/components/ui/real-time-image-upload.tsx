
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, Camera, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { 
  validateImageForMarketplace, 
  uploadImageToStorage, 
  logImageProcessing 
} from "@/utils/imageProcessingUtils";
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
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Check if device is mobile
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const handleRemoveImage = (fileId: string, imageUrl: string) => {
    // Remove from progress tracking
    const newProgress = { ...uploadProgress };
    delete newProgress[fileId];
    setUploadProgress(newProgress);

    // Remove from uploaded images
    const newUploadedImages = { ...uploadedImages };
    delete newUploadedImages[fileId];
    setUploadedImages(newUploadedImages);
    
    // Notify parent component
    onUploadComplete(Object.values(newUploadedImages));
  };

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
      
      setUploadProgress(prev => ({...prev, ...newUploadProgress}));
      
      const newUploadedImages: Record<string, string> = { ...uploadedImages };
      
      logImageProcessing('RealtimeUploadStart', { fileCount: files.length, bucket: storageBucket });
      
      for (let i = 0; i < files.length; i++) {
        const fileId = fileIds[i];
        const file = files[i];
        
        // Update progress
        newUploadProgress[fileId] = 10;
        setUploadProgress(prev => ({...prev, ...newUploadProgress}));
        
        // Validate file against marketplace standards
        const validation = validateImageForMarketplace(file);
        if (!validation.isValid) {
          toast({
            title: "Error",
            description: validation.errorMessage,
            variant: "destructive",
          });
          
          newUploadProgress[fileId] = -1; // Mark as error
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          continue;
        }
        
        try {
          // Update progress
          newUploadProgress[fileId] = 25;
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          
          // Upload image with marketplace optimization
          const imageUrl = await uploadImageToStorage(file, storageBucket, storagePath);
          
          // Update progress
          newUploadProgress[fileId] = 100;
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          
          // Store uploaded image URL
          newUploadedImages[fileId] = imageUrl;
          
          // Log success
          logImageProcessing('RealtimeUploadSuccess', { imageUrl });
        } catch (error) {
          logImageProcessing('RealtimeUploadError', {
            fileName: file.name,
            error: error instanceof Error ? error.message : String(error)
          });
          
          newUploadProgress[fileId] = -1; // Mark as error
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          
          toast({
            title: "Error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
        }
      }

      const finalUrls = Object.values(newUploadedImages);
      if (finalUrls.length > 0) {
        setUploadedImages(newUploadedImages);
        onUploadComplete(finalUrls);
        
        toast({
          title: "Success",
          description: `Uploaded ${Object.keys(newUploadedImages).length - Object.keys(uploadedImages).length} image${finalUrls.length > 1 ? 's' : ''}`,
        });
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
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }, [onUploadComplete, storageBucket, storagePath, uploadedImages]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {/* Uploaded images */}
        {Object.entries(uploadedImages).map(([fileId, imageUrl]) => (
          <div key={fileId} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => handleRemoveImage(fileId, imageUrl)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
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
        {Object.keys(uploadedImages).length < maxImages && (
          <div 
            className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-6 w-6 text-gray-400" />
            <p className="text-xs text-gray-500 mt-1">Upload</p>
          </div>
        )}
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
          disabled={isUploading || Object.keys(uploadedImages).length >= maxImages}
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
            disabled={isUploading || Object.keys(uploadedImages).length >= maxImages}
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
