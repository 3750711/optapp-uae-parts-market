import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingIndicator } from '@/components/admin/order/FallbackComponents';

const OrderDetailsRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && profile && id) {
      // Enforce verification: redirect unverified non-admins to pending-approval
      if (profile.user_type !== 'admin' && profile.verification_status !== 'verified') {
        navigate('/pending-approval', { replace: true });
        return;
      }

      // Redirect based on user role
      switch (profile.user_type) {
        case 'admin':
          navigate(`/admin/orders/${id}`, { replace: true });
          break;
        case 'seller':
          navigate(`/seller/orders/${id}`, { replace: true });
          break;
        case 'buyer':
        default:
          navigate(`/order-details/${id}`, { replace: true });
          break;
      }
    }
  }, [id, profile, isLoading, navigate]);

  if (isLoading) {
    return <LoadingIndicator message="Перенаправление..." />;
  }

  return null;
};

export default OrderDetailsRedirect;