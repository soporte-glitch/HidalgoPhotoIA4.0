import React, { useState, useCallback, useMemo } from 'react';
import type { ImageData } from './types';
import { editImageWithPrompt } from '../services/geminiService';
import { useBusy } from '../hooks/useBusy';
import BeforeAfterSlider from './BeforeAfterSlider';
import ImageUploader from './ImageUploader';
import { WandIcon, DownloadIcon, ResetIcon } from './Iconos';
import '../styles/NoirPremium.css';

interface Filters {
  brightness: number;
  contrast: number;
  saturate: number;
  blur: number;
  sepia: number;
}

const Slider: React.FC<{label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min?: number, max?: number, unit?: string, disabled: boolean}> = 
({label, value, onChange, min = 0, max = 200, unit = '%', disabled}) => (
  <div className="slider-control">
    <div className="label-row">
      <span className="label">{label}</span>
      <span className="value">{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={onChange} disabled={disabled} />
  </div>
);


const EditorFotos: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, runTask, error] = useBusy();
  const [filters, setFilters] = useState<Filters>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
    sepia: 0,
  });

  const handleImageUpload = useCallback((imageData: ImageData) => {
    setOriginalImage(imageData);
    setEditedImage(null);
    setPrompt('');
    resetFilters();
  }, []);

  const handleApplyIA = () => {
    if (!originalImage || !prompt) return;
    runTask(async () => {
      resetFilters(); 
      const result = await editImageWithPrompt(originalImage, prompt);
      if (result) {
        setEditedImage(result);
      }
    });
  };

  const handleReset = () => {
    setEditedImage(null);
    resetFilters();
  };

  const resetFilters = () => {
    setFilters({ brightness: 100, contrast: 100, saturate: 100, blur: 0, sepia: 0 });
  };
  
  const handleDownload = () => {
    const targetUrl = editedImage || originalImageUrl;
    if (!targetUrl) return;

    if (!editedImage && originalImageUrl && hasManualEdits) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = imageStyle.filter || '';
          ctx.drawImage(img, 0, 0);
          const link = document.createElement('a');
          link.href = canvas.toDataURL(originalImage?.mimeType || 'image/png');
          link.download = `editado_manual_${originalImage?.name || 'imagen'}.png`;
          link.click();
        }
      };
      img.src = originalImageUrl;
    } else if (editedImage) { 
      const link = document.createElement('a');
      link.href = editedImage;
      link.download = `editado_ia_${originalImage?.name || 'imagen'}.png`;
      link.click();
    }
  };
  
  const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null;
  
  const imageStyle = useMemo(() => ({
    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) blur(${filters.blur}px) sepia(${filters.sepia}%)`
  }), [filters]);

  const handleFilterChange = (filterName: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedImage(null);
    setFilters(f => ({ ...f, [filterName]: Number(e.target.value) }));
  };
  
  const hasManualEdits = useMemo(() => {
    return filters.brightness !== 100 || filters.contrast !== 100 || filters.saturate !== 100 || filters.blur !== 0 || filters.sepia !== 0;
  }, [filters]);

  return (
    <div className="editor-root">
      <div className="editor-workspace">
        <div className="image-area">
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Aplicando magia IA...</p>
            </div>
          )}
          {!originalImage ? (
             <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
          ) : editedImage && originalImageUrl ? (
            <BeforeAfterSlider beforeImage={originalImageUrl} afterImage={editedImage} />
          ) : (
            <img src={originalImageUrl!} alt="Original" style={imageStyle} className="max-w-full max-h-full object-contain rounded-lg" />
          )}
        </div>

        <div className="tools-panel">
          <div className="panel-header">
            <h2>Editor IA Premium</h2>
            <p>Realiza ajustes manuales o describe la edición que deseas con la IA.</p>
          </div>

          <div className="panel-section">
            <label className="panel-section-title">Edición con IA</label>
            <textarea
              className="prompt-area"
              placeholder="Ej: 'cambia el fondo a una playa tropical', 'haz que parezca un cuadro al óleo'..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
           <div className="panel-section">
            <label className="panel-section-title">Ajustes Manuales</label>
            <div className="flex flex-col gap-4">
              <Slider label="Brillo" value={filters.brightness} onChange={handleFilterChange('brightness')} disabled={isLoading} />
              <Slider label="Contraste" value={filters.contrast} onChange={handleFilterChange('contrast')} disabled={isLoading} />
              <Slider label="Saturación" value={filters.saturate} onChange={handleFilterChange('saturate')} disabled={isLoading} />
              <Slider label="Desenfoque" value={filters.blur} max={20} unit="px" onChange={handleFilterChange('blur')} disabled={isLoading}/>
              <Slider label="Sepia" value={filters.sepia} max={100} onChange={handleFilterChange('sepia')} disabled={isLoading} />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="panel-footer">
            <button
              onClick={handleApplyIA}
              disabled={!originalImage || !prompt || isLoading}
              className="btn-noir-primary"
            >
              <WandIcon />
              <span>{isLoading ? 'Aplicando...' : 'Aplicar IA'}</span>
            </button>
            <div className="button-group">
              <button onClick={handleReset} disabled={!originalImage || isLoading} className="btn-noir-secondary">
                <ResetIcon />
                <span>Reiniciar</span>
              </button>
              <button onClick={handleDownload} disabled={(!editedImage && !hasManualEdits) || isLoading} className="btn-noir-secondary">
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

export default EditorFotos;