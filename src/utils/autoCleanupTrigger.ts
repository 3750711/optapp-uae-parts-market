
import { cleanupCloudinaryData } from './cloudinaryDataCleaner';

// Auto-trigger cleanup for fixing broken preview URLs
export const triggerAutoCleanup = async () => {
  console.log('🚀 Auto-triggering Cloudinary data cleanup...');
  
  try {
    const result = await cleanupCloudinaryData();
    
    if (result.success) {
      console.log('✅ Auto-cleanup completed successfully:', {
        processed: result.processed,
        updated: result.updated
      });
    } else {
      console.error('❌ Auto-cleanup completed with errors:', {
        processed: result.processed,
        updated: result.updated,
        errors: result.errors
      });
    }
    
    return result;
  } catch (error) {
    console.error('💥 Auto-cleanup failed:', error);
    return {
      success: false,
      processed: 0,
      updated: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
};

// Auto-run cleanup on import (for immediate execution)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    triggerAutoCleanup();
  }, 2000); // Wait 2 seconds after page load
}
