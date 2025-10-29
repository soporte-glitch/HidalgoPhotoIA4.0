import React from 'react';
import ImageUploader from './ImageUploader';
import BeforeAfterSlider from './BeforeAfterSlider';
import type { ImageData } from './types';

interface ImageGalleryProps {
  originalImage: ImageData | null;
  editedImage: string | null;
  isLoading: boolean;
  onImageUpload: (imageData: ImageData) => void;
  imageStyle: React.CSSProperties;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ originalImage, editedImage, isLoading, onImageUpload, imageStyle }) => {

  const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null;
  
  const DisplayContent = () => {
    if (isLoading && originalImageUrl) {
      return (
        <div className="relative w-full aspect-video">
          <img src={originalImageUrl} alt="Procesando..." style={imageStyle} className="w-full h-full object-contain rounded-lg opacity-30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-secondary/70 rounded-xl p-8">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-accent"></div>
            <p className="text-brand-text-secondary mt-4">Aplicando magia de IA...</p>
          </div>
        </div>
      );
    }
    
    if (editedImage && originalImageUrl) {
      return <BeforeAfterSlider beforeImage={originalImageUrl} afterImage={editedImage} />;
    }
  
    if (originalImageUrl) {
       return <img src={originalImageUrl} alt="Imagen cargada" style={imageStyle} className="w-full h-full object-contain rounded-lg transition-all duration-300" />;
    }

    return <ImageUploader onImageUpload={onImageUpload} disabled={isLoading} />;
  }


  return (
     <div className="w-full aspect-video bg-brand-secondary rounded-xl p-2 shadow-lg flex items-center justify-center">
        <DisplayContent />
     </div>
  );
};

export default ImageGallery;