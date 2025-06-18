
import React, { useState, useCallback } from 'react';
import { useAdminOrderFormLogic } from '@/hooks/useAdminOrderFormLogic';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { toast } from '@/hooks/use-toast';

interface AdminFreeOrderFormProviderProps {
  children: (props: AdminFreeOrderFormContextValue) => React.ReactNode;
}

export interface AdminFreeOrderFormContextValue {
  // Form state
  formData: any;
  images: string[];
  videos: string[];
  selectedSeller: any;
  buyerProfiles: any[];
  
  // Loading states
  isLoading: boolean;
  canSubmit: boolean;
  isDataReady: boolean;
  
  // Form handlers
  handleInputChange: (field: string, value: string) => void;
  onImagesUpload: (urls: string[]) => void;
  onImageDelete: (url: string) => void;
  onVideoUpload: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
  
  // Actions
  handleCreateOrderClick: () => void;
  handleConfirmOrder: (e: React.FormEvent) => void;
  
  // Preview state
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
}

export const AdminFreeOrderFormProvider: React.FC<AdminFreeOrderFormProviderProps> = ({
  children
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const {
    formData,
    handleInputChange,
    images,
    videos,
    setAllImages,
    setVideos,
    isLoading,
    handleSubmit: originalHandleSubmit,
    selectedSeller,
    buyerProfiles,
    isDataReady
  } = useAdminOrderFormLogic();

  const { guardedSubmit, canSubmit } = useSubmissionGuard({
    timeout: 10000,
    onDuplicateSubmit: useCallback(() => {
      toast({
        title: "Заказ создается",
        description: "Пожалуйста подождите, заказ уже создается",
        variant: "destructive",
      });
    }, [])
  });

  const onImagesUpload = useCallback((urls: string[]) => {
    console.log('📸 AdminFreeOrderForm: New images uploaded:', urls);
    setAllImages(urls);
  }, [setAllImages]);

  const onImageDelete = useCallback((url: string) => {
    console.log('🗑️ AdminFreeOrderForm: Image deleted:', url);
    const updatedImages = images.filter(img => img !== url);
    setAllImages(updatedImages);
  }, [setAllImages, images]);

  const onVideoUpload = useCallback((urls: string[]) => {
    console.log('📹 AdminFreeOrderForm: New videos uploaded:', urls);
    setVideos([...videos, ...urls]);
  }, [setVideos, videos]);

  const onVideoDelete = useCallback((url: string) => {
    console.log('🗑️ AdminFreeOrderForm: Video deleted:', url);
    const updatedVideos = videos.filter(video => video !== url);
    setVideos(updatedVideos);
  }, [setVideos, videos]);

  const handleCreateOrderClick = useCallback(() => {
    setShowPreview(true);
  }, []);

  const handleConfirmOrder = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(false);
    guardedSubmit(async () => {
      await originalHandleSubmit(e);
    });
  }, [guardedSubmit, originalHandleSubmit]);

  const contextValue: AdminFreeOrderFormContextValue = {
    // Form state
    formData,
    images,
    videos,
    selectedSeller,
    buyerProfiles,
    
    // Loading states
    isLoading,
    canSubmit,
    isDataReady,
    
    // Form handlers
    handleInputChange,
    onImagesUpload,
    onImageDelete,
    onVideoUpload,
    onVideoDelete,
    
    // Actions
    handleCreateOrderClick,
    handleConfirmOrder,
    
    // Preview state
    showPreview,
    setShowPreview
  };

  return children(contextValue);
};
