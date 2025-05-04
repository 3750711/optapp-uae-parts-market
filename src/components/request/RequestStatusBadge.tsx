
import React from 'react';
import { Badge } from "@/components/ui/badge";

type RequestStatus = 'pending' | 'processing' | 'completed';

interface RequestStatusBadgeProps {
  status: RequestStatus;
}

export const RequestStatusBadge: React.FC<RequestStatusBadgeProps> = ({ status }) => {
  const getStatusBadgeVariant = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'secondary'; 
      case 'completed': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case 'pending': return 'В работе';
      case 'processing': return 'В работе';
      case 'completed': return 'Выполнен';
      default: return status;
    }
  };

  return (
    <Badge variant={getStatusBadgeVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
};

export default RequestStatusBadge;
