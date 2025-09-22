import { supabase } from "@/integrations/supabase/client";

export interface MediaUploadParams {
  productId: string;
  imageUrls: string[];
  videoUrls: string[];
  primaryImage?: string;
  userType: 'admin' | 'trusted_seller' | 'seller';
}

export class ProductMediaService {
  static async addMediaToProduct({
    productId,
    imageUrls,
    videoUrls,
    primaryImage,
    userType
  }: MediaUploadParams): Promise<void> {
    // Add images
    if (imageUrls.length > 0) {
      await this.addImages({
        productId,
        imageUrls,
        primaryImage,
        userType
      });
    }

    // Add videos
    if (videoUrls.length > 0) {
      await this.addVideos({
        productId,
        videoUrls,
        userType
      });
    }
  }

  private static async addImages({
    productId,
    imageUrls,
    primaryImage,
    userType
  }: {
    productId: string;
    imageUrls: string[];
    primaryImage?: string;
    userType: 'admin' | 'trusted_seller' | 'seller';
  }): Promise<void> {
    if (userType === 'admin') {
      // Admin uses RPC functions
      for (const url of imageUrls) {
        const { error } = await supabase.rpc('admin_insert_product_image', {
          p_product_id: productId,
          p_url: url,
          p_is_primary: url === primaryImage
        });

        if (error) {
          console.error('❌ Error adding admin image:', error);
          throw new Error(`Ошибка добавления изображения: ${error.message}`);
        }
      }
      console.log(`✅ ${imageUrls.length} images added via admin RPC for product ${productId}`);
    } else {
      // Trusted sellers and regular sellers use direct inserts
      const imageInserts = imageUrls.map(url => ({
        product_id: productId,
        url: url,
        is_primary: url === primaryImage
      }));

      const { error } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (error) {
        console.error('❌ Error adding images:', error);
        throw new Error(`Ошибка добавления изображений: ${error.message}`);
      }
      
      console.log(`✅ ${imageUrls.length} images added via direct insert for product ${productId}`);
    }
  }

  private static async addVideos({
    productId,
    videoUrls,
    userType
  }: {
    productId: string;
    videoUrls: string[];
    userType: 'admin' | 'trusted_seller' | 'seller';
  }): Promise<void> {
    if (userType === 'admin') {
      // Admin uses RPC functions
      for (const url of videoUrls) {
        const { error } = await supabase.rpc('admin_insert_product_video', {
          p_product_id: productId,
          p_url: url
        });

        if (error) {
          console.error('❌ Error adding admin video:', error);
          throw new Error(`Ошибка добавления видео: ${error.message}`);
        }
      }
      console.log(`✅ ${videoUrls.length} videos added via admin RPC for product ${productId}`);
    } else {
      // Trusted sellers and regular sellers use direct inserts
      const videoInserts = videoUrls.map(url => ({
        product_id: productId,
        url: url
      }));

      const { error } = await supabase
        .from('product_videos')
        .insert(videoInserts);

      if (error) {
        console.error('❌ Error adding videos:', error);
        throw new Error(`Ошибка добавления видео: ${error.message}`);
      }
      
      console.log(`✅ ${videoUrls.length} videos added via direct insert for product ${productId}`);
    }
  }
}