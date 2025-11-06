

import React, { useCallback, useState } from 'react';
import type { ImageData } from './types';
import { UploadIcon } from './Iconos';

interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData) => void;
  disabled: boolean;
  compact?: boolean; // Nueva prop
}

const MAX_DIMENSION = 1920; // Optimización de rendimiento

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = React.useId();

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_DIMENSION;
              width = MAX_DIMENSION;
            } else {
              width = (width / height) * MAX_DIMENSION;
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const quality = mimeType === 'image/jpeg' ? 0.92 : undefined;
          const dataUrl = canvas.toDataURL(mimeType, quality);
          const base64 = dataUrl.split(',')[1];
          
          if (base64) {
            onImageUpload({
              base64,
              mimeType,
              name: file.name,
            });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  }, [disabled, onImageUpload]);

  const onButtonClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
     // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  const iconSize = compact ? 'w-8 h-8' : 'w-12 h-12';
  const mainTextSize = compact ? 'text-sm' : 'text-base';
  const subTextSize = compact ? 'text-xs' : 'text-sm';
  const minHeight = compact ? 'h-full min-h-32' : 'min-h-64';


  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative flex flex-col items-center justify-center w-full ${minHeight} border-2 border-dashed rounded-lg transition-colors duration-300 ${isDragging ? 'border-brand-accent bg-brand-secondary' : 'border-brand-secondary bg-brand-primary'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <input
        type="file"
        id={inputId}
        className="hidden"
        accept="image/*"
        onChange={onButtonClick}
        disabled={disabled}
      />
      <label htmlFor={inputId} className={`flex flex-col items-center justify-center w-full h-full p-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className={iconSize}><UploadIcon /></div>
        <p className={`mt-2 text-brand-text ${mainTextSize}`}>Arrastra una imagen</p>
        <p className={`text-brand-text-secondary ${subTextSize}`}>o haz clic</p>
      </label>
    </div>
  );
};

export default ImageUploader;