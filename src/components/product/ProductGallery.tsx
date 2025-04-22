
import React, { useState } from "react";
import { ProductImage } from "@/types/product";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, title }) => {
  const [activeImage, setActiveImage] = useState<string>(images[0] || "");

  return (
    <div>
      <div className="mb-4 overflow-hidden rounded-lg">
        <AspectRatio ratio={16 / 9}>
          <img 
            src={activeImage} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </AspectRatio>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <div 
            key={index} 
            className={`overflow-hidden rounded-md border-2 aspect-square ${activeImage === image ? 'border-optapp-yellow' : 'border-transparent'} hover:border-optapp-yellow cursor-pointer`}
            onClick={() => setActiveImage(image)}
          >
            <img 
              src={image} 
              alt={`${title} ${index + 1}`} 
              className="w-full h-full object-cover" 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
