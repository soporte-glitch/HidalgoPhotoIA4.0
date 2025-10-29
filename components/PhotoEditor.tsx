import React, { useState, useEffect } from 'react';
import type { ImageData } from './types';
import ImageGallery from './ImageGallery';
import EditorPanel from './EditorPanel';
import { editImageWithPrompt } from '../services/geminiService';
import { syncWithLumina } from '../services/luminaService';

const SESSION_ORIGINAL_KEY = 'hidalgo_photo_editor_original';
const SESSION_EDITED_KEY = 'hidalgo_photo_editor_edited';
const SESSION_ADJUSTMENTS_KEY = 'hidalgo_photo_editor_adjustments';

interface ManualAdjustments {
  brightness: number;
  contrast: number;
  saturate: number;
  sharpness: number; // Custom filter, will be handled via prompt
}

const defaultAdjustments: ManualAdjustments = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  sharpness: 0,
};


const PhotoEditor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<ManualAdjustments>(defaultAdjustments);

  // Cargar estado desde sessionStorage al montar el componente
  useEffect(() => {
    try {
      const storedOriginal = sessionStorage.getItem(SESSION_ORIGINAL_KEY);
      if (storedOriginal) setOriginalImage(JSON.parse(storedOriginal));
      
      const storedEdited = sessionStorage.getItem(SESSION_EDITED_KEY);
      if (storedEdited) setEditedImage(storedEdited);

      const storedAdjustments = sessionStorage.getItem(SESSION_ADJUSTMENTS_KEY);
      if (storedAdjustments) setAdjustments(JSON.parse(storedAdjustments));

    } catch (e) {
      console.error("Error al leer desde sessionStorage", e);
    }
  }, []);

  // Guardar estado en sessionStorage cuando cambie
  useEffect(() => {
    try {
      if (originalImage) sessionStorage.setItem(SESSION_ORIGINAL_KEY, JSON.stringify(originalImage));
      else sessionStorage.removeItem(SESSION_ORIGINAL_KEY);

      if (editedImage) sessionStorage.setItem(SESSION_EDITED_KEY, editedImage);
      else sessionStorage.removeItem(SESSION_EDITED_KEY);

      sessionStorage.setItem(SESSION_ADJUSTMENTS_KEY, JSON.stringify(adjustments));

    } catch (e) {
      console.error("Error al guardar en sessionStorage", e);
    }
  }, [originalImage, editedImage, adjustments]);


  const handleImageUpload = (imageData: ImageData) => {
    setOriginalImage(imageData);
    setEditedImage(null);
    setAdjustments(defaultAdjustments);
    setError(null);
  };

  const handleRestore = () => {
    setEditedImage(null);
    setPrompt('');
    setError(null);
    setAdjustments(defaultAdjustments);
  };

  const handleGenerate = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt || prompt;
    if (!originalImage || !finalPrompt.trim()) {
      setError('Por favor, carga una imagen y describe la edición.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const resultUrl = await editImageWithPrompt(originalImage, finalPrompt);
      setEditedImage(resultUrl);
      setAdjustments(defaultAdjustments);
      await syncWithLumina({ 
        action: 'editImage',
        success: true,
        imageName: originalImage.name, 
        prompt: finalPrompt 
      });
    } catch (err) {
      setError('Hubo un error al generar la edición. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    // Note: Downloading will not include client-side CSS filter adjustments.
    if (!editedImage || !originalImage) return;
    const link = document.createElement('a');
    link.href = editedImage;
    const nameParts = originalImage.name.split('.');
    const extension = editedImage.startsWith('data:image/png') ? 'png' : 'jpg';
    const name = nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : originalImage.name;
    
    link.download = `${name}-mejorada.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imageStyle = {
    filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturate}%)`
  };

  return (
    <div className="animate-fade-in">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif">
          Hidalgo<span className="text-brand-accent">PhotoAI</span>
        </h1>
        <p className="text-brand-text-secondary mt-2 font-sans">
          Tu estudio de edición fotográfica con el poder de la Inteligencia Artificial.
        </p>
      </header>

      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ImageGallery
              originalImage={originalImage}
              editedImage={editedImage}
              isLoading={isLoading}
              onImageUpload={handleImageUpload}
              imageStyle={imageStyle}
            />
          </div>
          <div className="lg:col-span-1">
            <EditorPanel 
              originalImage={originalImage}
              editedImage={editedImage}
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={() => handleGenerate()}
              onRestore={handleRestore}
              onDownload={handleDownload}
              isLoading={isLoading}
              adjustments={adjustments}
              setAdjustments={setAdjustments}
            />
          </div>
        </div>
        {error && (
            <div className="mt-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center max-w-3xl mx-auto">
                {error}
            </div>
        )}
      </div>
      
      <footer className="text-center mt-12 py-4 text-xs text-brand-text-secondary">
        &copy; {new Date().getFullYear()} Hidalgo Corp. Potenciado por Google Gemini.
      </footer>
    </div>
  );
};

export default PhotoEditor;