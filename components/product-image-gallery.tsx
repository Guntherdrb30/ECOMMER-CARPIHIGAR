'use client';

import { useState } from 'react';

export function ProductImageGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(images[0] || 'https://via.placeholder.com/400');

  return (
    <div>
      <div style={{ backgroundImage: `url(${selectedImage})` }} className="bg-gray-200 h-96 w-full rounded-lg shadow-md mb-4 bg-cover bg-center"></div>
      <div className="grid grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            style={{ backgroundImage: `url(${image})` }}
            className={`bg-gray-200 h-20 w-full rounded-md bg-cover bg-center cursor-pointer ${selectedImage === image ? 'border-2 border-brand' : ''}`}
            onClick={() => setSelectedImage(image)}
          ></div>
        ))}
      </div>
    </div>
  );
}
