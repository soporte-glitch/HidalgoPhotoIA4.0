import React, { useCallback, useState } from 'react';
import type { ImageData } from './types';
import { UploadIcon } from './Iconos';

interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData) => void;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        if (base64) {
          onImageUpload({
            base64,
            mimeType: file.type,
            name: file.name,
          });
        }
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
  }, [disabled]);

  const onButtonClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`relative flex flex-col items-center justify-center w-full h-full min-h-64 border-2 border-dashed rounded-lg transition-colors duration-300 ${isDragging ? 'border-brand-accent bg-brand-secondary' : 'border-gray-600 bg-brand-primary'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*"
        onChange={onButtonClick}
        disabled={disabled}
      />
      <label htmlFor="file-upload" className={`flex flex-col items-center justify-center w-full h-full ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <UploadIcon />
        <p className="mt-4 text-brand-text">Arrastra una imagen aquí</p>
        <p className="text-sm text-brand-text-secondary">o haz clic para seleccionarla</p>
      </label>
    </div>
  );
};

export default ImageUploader;
