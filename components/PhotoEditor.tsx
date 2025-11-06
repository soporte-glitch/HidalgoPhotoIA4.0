
import React, { useState, useCallback } from 'react';
import type { ImageData } from './types';
import { editImageWithPrompt } from '../services/geminiService';
import { useBusy } from '../hooks/useBusy';
import BeforeAfterSlider from './BeforeAfterSlider';
import ImageUploader from './ImageUploader';
import EditorPanel from './EditorPanel';

const PhotoEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, runTask, error] = useBusy();

  const handleImageUpload = useCallback((imageData: ImageData) => {
    setOriginalImage(imageData);
    setEditedImage(null);
    setPrompt('');
  }, []);

  const handleApply = () => {
    if (!originalImage || !prompt) return;
    runTask(async () => {
      const result = await editImageWithPrompt(originalImage, prompt);
      if (result) {
        setEditedImage(result);
      }
    });
  };

  const handleReset = () => {
    setEditedImage(null);
  };
  
  const handleDownload = () => {
    if (!editedImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    link.download = `editado_${originalImage?.name || 'imagen'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-xl p-4 border border-white/10 shadow-lg relative">
        {!originalImage ? (
          <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
        ) : (
          <div className="w-full h-full relative">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-panel/80 rounded-xl z-10">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-neon"></div>
                <p className="text-white/80 mt-4">Aplicando magia de IA...</p>
              </div>
            )}
            {editedImage && originalImageUrl ? (
                <BeforeAfterSlider beforeImage={originalImageUrl} afterImage={editedImage} />
            ) : (
                <img src={originalImageUrl!} alt="Original" className="w-full h-full object-contain rounded-lg" />
            )}
          </div>
        )}
        {error && <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-red-400 text-sm p-2 bg-black/50 rounded">{error}</p>}
      </div>

      <div className="w-full lg:w-96 flex-shrink-0">
        <EditorPanel
          prompt={prompt}
          onPromptChange={setPrompt}
          onApply={handleApply}
          onReset={handleReset}
          onDownload={handleDownload}
          isLoading={isLoading}
          canApply={!!originalImage && !!prompt}
          canReset={!!editedImage}
          canDownload={!!editedImage}
        />
      </div>
    </div>
  );
};

export default PhotoEditor;
