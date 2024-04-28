'use client';

import { useState } from 'react';

const ProductCard = () => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="card-container relative w-64 h-40 mx-auto">
      <div 
        className={`card-flip ${flipped ? 'rotate-y-180' : ''}`}
        onClick={() => setFlipped(!flipped)}
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
      >
        <div className="card-front bg-blue-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
          Product Image
        </div>
        <div className="card-back bg-red-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
          Product Details
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
