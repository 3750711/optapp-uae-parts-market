import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';

interface Order {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  status: string;
  images: string[];
  created_at: string;
  order_number: number;
}

interface ModernOrderCardProps {
  order: Order;
}

export const ModernOrderCard: React.FC<ModernOrderCardProps> = ({ order }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const isNew = () => {
    const orderDate = new Date(order.created_at);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return orderDate > threeDaysAgo;
  };

  return (
    <Link to={`/order/${order.id}`} className="block group">
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1">
        {/* Image Section - 70% of card */}
        <div className="relative aspect-square bg-slate-100">
          {order.images && order.images.length > 0 ? (
            <img
              src={order.images[0]}
              alt={order.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-slate-400" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={order.status} />
          </div>

          {/* New Badge */}
          {isNew() && (
            <div className="absolute top-3 left-3">
              <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                Новое
              </span>
            </div>
          )}
        </div>

        {/* Content Section - 30% of card */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {order.title}
          </h3>
          
          <p className="text-sm text-slate-600">
            {order.brand} {order.model}
          </p>
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-2xl font-bold text-slate-800">
              {formatPrice(order.price)}
            </span>
            <span className="text-xs text-slate-500">
              {formatDate(order.created_at)}
            </span>
          </div>

          <div className="text-xs text-slate-500 pt-1">
            Заказ №{order.order_number}
          </div>
        </div>
      </div>
    </Link>
  );
};