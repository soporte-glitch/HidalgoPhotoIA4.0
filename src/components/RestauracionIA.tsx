import React, { useState, useCallback } from 'react';
import type { ImageData } from './types';
import { restorePhoto } from '../services/geminiService';
import ImageUploader from './ImageUploader';
import BeforeAfterSlider from './BeforeAfterSlider';
import { WandIcon, DownloadIcon, ResetIcon } from './Iconos';
import { useBusy } from '../hooks/useBusy';
import '../styles/NoirPremium.css';

const RestauracionIA: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [enhanceQuality, setEnhanceQuality] = useState<boolean>(true);
  const [focusOnFaces, setFocusOnFaces] = useState<boolean>(true);
  const [addWatermark, setAddWatermark] = useState<boolean>(true);
  // Fix: Destructured `useBusy` as an object instead of an array to resolve iterator error.
  const { isBusy: isLoading, runTask: runRestore, error } = useBusy();

  const handleImageUpload = useCallback((imageData: ImageData) => {
    setOriginalImage(imageData);
    setRestoredImage(null);
    setPrompt('');
  }, []);

  const handleRestore = () => {
    if (!originalImage) return;
    runRestore(async () => {
      const result = await restorePhoto(originalImage, enhanceQuality, prompt, focusOnFaces);
      if (result) {
        setRestoredImage(result);
      }
    });
  };

  const handleDownload = () => {
    if (!restoredImage) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);

        if (addWatermark) {
            const fontSize = Math.max(18, Math.floor(img.naturalWidth / 60));
            ctx.font = `500 ${fontSize}px Rajdhani`; /* Changed from Poppins to Rajdhani */
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 5;
            ctx.fillText("Restaurado con OmniPhoto IA Pro", canvas.width - 15, canvas.height - 15);
        }

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `restaurado_${originalImage?.name || 'imagen'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    img.src = restoredImage;
  };

  const handleReset = () => {
      setOriginalImage(null);
      setRestoredImage(null);
      setPrompt('');
  };
  
  const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null;

  return (
    <div className="editor-root">
      <div className="editor-workspace">
        <div className="image-area">
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Restaurando imagen...</p>
            </div>
          )}
          {!originalImage ? (
            <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
          ) : restoredImage && originalImageUrl ? (
            <BeforeAfterSlider beforeImage={originalImageUrl} afterImage={restoredImage} />
          ) : (
            <img src={originalImageUrl!} alt="Original" className="max-w-full max-h-full object-contain rounded-lg" />
          )}
        </div>

        <div className="tools-panel avatar-box">
          <div className="panel-header">
            <h2 className="header-logo" style={{textAlign: 'left', margin: '0 0 10px 0', fontSize: '24px'}}>Restauración IA</h2>
            <p>Repara fotos antiguas o dañadas. La IA protegerá rostros y bordes automáticamente.</p>
          </div>

          <div className="panel-section">
            <label htmlFor="restore-prompt" className="panel-section-title">
              Instrucciones Adicionales
            </label>
            <textarea
              id="restore-prompt"
              className="prompt-area"
              placeholder="Ej: 'reconstruye la esquina superior izquierda', 'aclara el rostro de la mujer'..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex flex-col gap-3">
             <div className="checkbox-control">
                <input
                type="checkbox"
                id="focus-on-faces-restore"
                checked={focusOnFaces}
                onChange={(e) => setFocusOnFaces(e.target.checked)}
                disabled={isLoading}
                />
                <label htmlFor="focus-on-faces-restore">
                Enfoque en Restauración Facial
                </label>
            </div>
            <div className="checkbox-control">
                <input
                type="checkbox"
                id="enhance-quality-restore"
                checked={enhanceQuality}
                onChange={(e) => setEnhanceQuality(e.target.checked)}
                disabled={isLoading}
                />
                <label htmlFor="enhance-quality-restore">
                Mejorar a Calidad Ultra (8K)
                </label>
            </div>
             <div className="checkbox-control">
                <input type="checkbox" id="add-watermark-restore" checked={addWatermark} onChange={(e) => setAddWatermark(e.target.checked)} />
                <label htmlFor="add-watermark-restore">Añadir firma de autor IA</label>
            </div>
          </div>
          
          {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}

          <div className="panel-footer">
            <button
              onClick={handleRestore}
              disabled={!originalImage || isLoading}
              className="btn-legendary"
            >
              <WandIcon />
              <span>{isLoading ? 'Restaurando...' : 'Restaurar Foto'}</span>
            </button>
            <div className="button-group">
              <button
                onClick={handleReset}
                disabled={!originalImage || isLoading}
                className="btn-legendary"
              >
                <ResetIcon />
                <span>Limpiar</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!restoredImage || isLoading}
                className="btn-legendary"
              >
                <DownloadIcon />
                <span>Descargar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestauracionIA;