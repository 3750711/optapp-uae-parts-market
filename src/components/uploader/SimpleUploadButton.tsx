import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

interface SimpleUploadButtonProps {
  onUpload: (urls: string[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  children?: React.ReactNode;
}

const SimpleUploadButton: React.FC<SimpleUploadButtonProps> = ({
  onUpload,
  disabled = false,
  maxFiles = 10,
  children
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFiles } = useCloudinaryUpload();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Simple validation
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 20 * 1024 * 1024; // 20MB
      return isImage && isValidSize;
    });

    if (validFiles.length === 0) {
      alert('Please select valid image files (max 20MB each)');
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrls = await uploadFiles(validFiles.slice(0, maxFiles));
      onUpload(uploadedUrls);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button 
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {children || 'Upload Photos'}
          </>
        )}
      </Button>
    </>
  );
};

export default SimpleUploadButton;