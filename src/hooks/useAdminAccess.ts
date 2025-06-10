
import { useAuth } from '@/contexts/AuthContext';

export const useAdminAccess = () => {
  const { isAdmin } = useAuth();
  
  return {
    isAdmin: isAdmin === true,
    // Add a function to check if a user can view a specific product status
    canViewProductStatus: (status: string) => {
      // Admins can view all product statuses
      if (isAdmin === true) {
        return true;
      }
      
      // Non-admins can only view active or sold products
      // unless they are the seller of the product
      return ['active', 'sold'].includes(status);
    }
  };
};
