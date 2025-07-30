import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const SellerOrderRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      // Redirect from old seller order route to new unified route
      navigate(`/seller/orders/${id}`, { replace: true });
    }
  }, [id, navigate]);

  return null;
};

export default SellerOrderRedirect;