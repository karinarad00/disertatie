

import React, { useState } from "react";

const ImageWithFallback = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);

  // Using a simple gray background placeholder
  const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e5e7eb'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z'/%3E%3C/svg%3E";

  return (
    <div className={`overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg ${className}`}>
      <img
        src={error || !imgSrc ? placeholder : imgSrc}
        alt={alt}
        className="max-w-full max-h-full object-contain p-1"
        onError={() => setError(true)}
      />
    </div>
  );
};

export default ImageWithFallback;
