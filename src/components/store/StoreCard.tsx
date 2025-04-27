
import React from 'react';
import { Link } from 'react-router-dom';
import { StoreWithImages } from '@/types/store';
import { StarIcon, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StoreCardProps {
  store: StoreWithImages;
}

export const StoreCard = ({ store }: StoreCardProps) => {
  const { id, name, description, address, phone, tags, rating } = store;
  
  // Find the primary image or use the first one
  const primaryImage = store.store_images?.find(img => img.is_primary);
  const displayImage = primaryImage?.url || 
                      store.store_images?.[0]?.url || 
                      'https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=500&auto=format&fit=crop';
  
  return (
    <Link to={`/store/${id}`} className="block rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img 
          src={displayImage}
          alt={name}
          className="w-full h-full object-cover"
        />
        {rating > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 rounded-full px-2 py-1 flex items-center text-sm">
            <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="font-medium">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold truncate">{name}</h3>
        </div>
        
        {description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
        )}
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">{address}</span>
        </div>
        
        {phone && (
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
            <span>{phone}</span>
          </div>
        )}
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};
