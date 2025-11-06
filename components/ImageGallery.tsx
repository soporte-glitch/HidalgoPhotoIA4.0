import React, { useState } from 'react';
import ImageUploader from './ImageUploader';
import type { ImageData } from './types';

interface ImageGalleryProps {
  originalImage: ImageData | null;
  editedImage: string | null;
  isLoading: boolean;
  onImageUpload: (imageData: ImageData) => void;
  imageStyle: React.CSSProperties;
}

const ZoomControls: React.FC<{ onZoomIn: () => void; onZoomOut: () => void; onZoomFit: () => void; }> = ({ onZoomIn, onZoomOut, onZoomFit }) => (
    <div className="absolute bottom-4 right-4 flex items-center bg-brand-secondary/80 backdrop-blur-sm rounded-lg shadow-lg">
        <button onClick={onZoomOut} className="p-2 text-brand-text hover:text-brand-accent transition-colors">-</button>
        <button onClick={onZoomFit} className="p-2 text-brand-text hover:text-brand-accent transition-colors text-xs border-x border-brand-primary">FIT</button>
        <button onClick={onZoomIn} className="p-2 text-brand-text hover:text-brand-accent transition-colors">+</button>
    </div>
);


const ImageGallery: React.FC<ImageGalleryProps> = ({ originalImage, editedImage, isLoading, onImageUpload, imageStyle }) => {
  const [zoom, setZoom] = useState(1);
  const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null;
  
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.2));
  const handleZoomFit = () => setZoom(1);

  const combinedStyle: React.CSSProperties = { 
    ...imageStyle, 
    transform: `scale(${zoom})`,
    transition: 'transform 0.2s ease-out'
  };

  const DisplayContent = () => {
    if (isLoading && originalImageUrl) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <img src={originalImageUrl} alt="Procesando..." style={imageStyle} className="w-full h-full object-contain rounded-lg opacity-30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-secondary/70 rounded-xl p-8">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-accent"></div>
            <p className="text-brand-text-secondary mt-4">Aplicando magia de IA...</p>
          </div>
        </div>
      );
    }
    
    const imageToShow = editedImage || originalImageUrl;

    if (imageToShow) {
       return <img src={imageToShow} alt="Imagen" style={combinedStyle} className="w-full h-full object-contain rounded-lg" />;
    }

    return <ImageUploader onImageUpload={onImageUpload} disabled={isLoading} />;
  }


  return (
     <div className="relative w-full h-full bg-brand-secondary rounded-xl p-2 shadow-lg flex items-center justify-center">
       <div className="w-full h-full overflow-auto rounded-lg">
          <DisplayContent />
       </div>
       {(originalImage || editedImage) && <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onZoomFit={handleZoomFit} />}
     </div>
  );
};

export default ImageGallery;