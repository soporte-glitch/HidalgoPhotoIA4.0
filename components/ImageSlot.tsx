
import React from 'react';
import ImageUploader from './ImageUploader';
import type { ImageData } from './types';

interface ImageSlotProps {
  label: string;
  icon: string;
  imageData: ImageData | null;
  onImageUpload: (data: ImageData) => void;
  onClear: () => void;
  disabled: boolean;
}

const ImageSlot: React.FC<ImageSlotProps> = ({ label, icon, imageData, onImageUpload, onClear, disabled }) => {
  const imageUrl = imageData ? `data:${imageData.mimeType};base64,${imageData.base64}` : null;

  return (
    <div className="flex flex-col text-center">
        <label className="text-sm font-semibold text-brand-text mb-2 flex items-center justify-center">
            <span className="mr-2 text-lg">{icon}</span>
            {label}
        </label>
        <div className="aspect-square w-full bg-brand-primary rounded-lg relative group">
            {imageUrl ? (
                <>
                    <img src={imageUrl} alt={label} className="w-full h-full object-cover rounded-lg" />
                    <button
                        onClick={onClear}
                        disabled={disabled}
                        className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        aria-label={`Eliminar imagen de ${label}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </>
            ) : (
                <ImageUploader onImageUpload={onImageUpload} disabled={disabled} compact />
            )}
        </div>
    </div>
  );
};

export default ImageSlot;