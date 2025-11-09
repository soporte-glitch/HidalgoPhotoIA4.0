import React, { useState, useCallback } from 'react';
import type { ImageData } from './types';
import { UploadIcon } from './Iconos';

interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData) => void;
  disabled?: boolean;
  compact?: boolean;
}

const fileToImageData = (file: File): Promise<ImageData | null> => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIMENSION = 1920;
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height / width) * MAX_DIMENSION);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width / height) * MAX_DIMENSION);
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
          resolve({ base64, mimeType, name: file.name });
        } else {
          console.warn(`No se pudo procesar el archivo: ${file.name}`);
          resolve(null);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = error => {
      console.error(`Error al leer el archivo ${file.name}:`, error);
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
};

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled = false, compact = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = React.useId();

  const handleFileChange = async (files: FileList | null) => {
    if (files && files[0]) {
      const imageData = await fileToImageData(files[0]);
      if (imageData) {
        onImageUpload(imageData);
      }
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) {
      await handleFileChange(e.dataTransfer.files);
    }
  }, [disabled, onImageUpload]);

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

  const baseClasses = 'relative flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg transition-colors duration-300';
  const stateClasses = isDragging ? 'border-brand-accent bg-brand-secondary/50' : 'border-brand-secondary hover:border-brand-accent';
  const disabledClasses = disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragEnter}
      onDrop={handleDrop}
      className={`${baseClasses} ${stateClasses} ${disabledClasses} bg-black/20`}
    >
      <input
        type="file"
        id={inputId}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files)}
        disabled={disabled}
      />
      <label htmlFor={inputId} className={`flex flex-col items-center justify-center w-full h-full p-4 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className={compact ? 'w-8 h-8 text-brand-accent' : 'w-12 h-12 text-brand-accent'}>
          <UploadIcon />
        </div>
        {!compact && (
          <>
            <p className="mt-2 text-brand-text">Arrastra tu imagen aquí</p>
            <p className="text-sm text-brand-text-secondary">o haz clic para seleccionar</p>
          </>
        )}
      </label>
    </div>
  );
};

export default ImageUploader;
