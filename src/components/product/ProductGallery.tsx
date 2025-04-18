
import React, { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, title }) => {
  const [activeImage, setActiveImage] = useState<string>(images[0] || "");

  return (
    <div>
      <div className="mb-4 overflow-hidden rounded-lg">
        <img 
          src={activeImage} 
          alt={title}
          className="w-full object-cover"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <div 
            key={index} 
            className={`overflow-hidden rounded-md border-2 ${activeImage === image ? 'border-optapp-yellow' : 'border-transparent'} hover:border-optapp-yellow cursor-pointer`}
            onClick={() => setActiveImage(image)}
          >
            <img src={image} alt={`${title} ${index + 1}`} className="w-full h-24 object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
