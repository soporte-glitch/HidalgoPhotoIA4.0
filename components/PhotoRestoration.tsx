import React, { useState, useCallback } from 'react';
import type { ImageData } from './types';
import { restorePhoto } from '../services/geminiService';
import ImageUploader from './ImageUploader';
import BeforeAfterSlider from './BeforeAfterSlider';
import { WandIcon, DownloadIcon, ResetIcon } from './Iconos';
import { useBusy } from '../hooks/useBusy';

const PhotoRestoration: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [enhanceQuality, setEnhanceQuality] = useState<boolean>(true);

  const [isLoading, runRestore, error] = useBusy();

  const handleImageUpload = useCallback((imageData: ImageData) => {
    setOriginalImage(imageData);
    setRestoredImage(null);
    setPrompt('');
  }, []);

  const handleRestore = () => {
    if (!originalImage) return;

    runRestore(async () => {
      const result = await restorePhoto(originalImage, enhanceQuality, prompt);
      if (result) {
        setRestoredImage(result);
      }
    });
  };

  const handleDownload = () => {
    if (!restoredImage) return;
    const link = document.createElement('a');
    link.href = restoredImage;
    link.download = `restaurado_${originalImage?.name || 'imagen'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleReset = () => {
      setOriginalImage(null);
      setRestoredImage(null);
      setPrompt('');
  }
  
  const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-xl p-4 border border-white/10 shadow-lg">
        {!originalImage ? (
          <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
        ) : (
          <div className="w-full h-full relative">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-panel/80 rounded-xl z-10">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-neon"></div>
                <p className="text-white/80 mt-4">Restaurando imagen...</p>
              </div>
            )}
            {restoredImage && originalImageUrl ? (
                <BeforeAfterSlider beforeImage={originalImageUrl} afterImage={restoredImage} />
            ) : (
                <img src={originalImageUrl!} alt="Original" className="w-full h-full object-contain rounded-lg" />
            )}
          </div>
        )}
      </div>

      <div className="w-full lg:w-96 flex-shrink-0">
        <div className="bg-panel p-6 rounded-xl shadow-neon-gold border border-white/10 flex flex-col h-full">
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Cinzel Decorative', serif" }}>Restauración IA</h2>
          <p className="text-white/60 mb-6 text-sm flex-grow">Repara fotos antiguas o dañadas. Describe cualquier detalle específico para guiar a la IA.</p>
          
          <div className="space-y-4">
              <div>
                <label htmlFor="restore-prompt" className="block text-sm font-medium text-white/80 mb-2">
                    Instrucciones Adicionales (Opcional)
                </label>
                <textarea
                    id="restore-prompt"
                    rows={3}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-neon transition"
                    placeholder="Ej: 'reconstruye la esquina superior izquierda', 'aclara el rostro de la mujer'..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                />
              </div>
               <div className="flex items-center justify-center">
                    <input
                    type="checkbox"
                    id="enhance-quality-restore"
                    checked={enhanceQuality}
                    onChange={(e) => setEnhanceQuality(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--brand-neon-pink)] focus:ring-[var(--brand-neon-pink)]"
                    disabled={isLoading}
                    />
                    <label htmlFor="enhance-quality-restore" className="ml-2 block text-sm text-white/80">
                        Mejorar a Calidad Ultra (8K)
                    </label>
                </div>
          </div>


          <div className="mt-auto space-y-3 pt-6 border-t border-white/10">
            <button
              onClick={handleRestore}
              disabled={!originalImage || isLoading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-[var(--brand-neon-pink)] to-[var(--brand-neon)] text-black font-bold py-3 px-4 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:scale-105"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-black mr-2"></div>
                  Restaurando...
                </>
              ) : (
                <>
                  <WandIcon />
                  <span className="ml-2">Restaurar Foto</span>
                </>
              )}
            </button>
            <div className="flex space-x-3">
                <button
                    onClick={handleReset}
                    disabled={!originalImage || isLoading}
                    className="w-full flex items-center justify-center bg-white/10 text-white/80 font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                    <ResetIcon />
                    <span className="ml-2">Limpiar</span>
                </button>
                <button
                onClick={handleDownload}
                disabled={!restoredImage || isLoading}
                className="w-full flex items-center justify-center bg-white/10 text-white/80 font-semibold py-2 px-4 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                    <DownloadIcon />
                    <span className="ml-2">Descargar</span>
                </button>
            </div>
          </div>
          {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default PhotoRestoration;
