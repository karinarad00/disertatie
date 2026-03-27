

const ImageWithFallback = ({ src, alt, className }) => {
  const fallback =
    "https://www.adaptivewfs.com/wp-content/uploads/2020/07/logo-placeholder-image-6-1024x1024.png";
  return <img src={src || fallback} alt={alt} className={className} />;
};

export default ImageWithFallback;
