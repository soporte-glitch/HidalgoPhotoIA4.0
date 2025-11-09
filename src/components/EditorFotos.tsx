import React, { useState, useCallback, useMemo } from 'react';
import type { ImageData } from './types';
import { editImageWithPrompt, enhanceImageTo8K, generateImageCaption } from '../services/geminiService';
import { useBusy } from '../hooks/useBusy';
import BeforeAfterSlider from './BeforeAfterSlider';
import ImageUploader from './ImageUploader';
import { WandIcon, DownloadIcon, ResetIcon, EnhanceIcon, CaptionIcon } from './Iconos';
import ZoomPanImageContainer from './common/ZoomPanImageContainer'; // Import the new component
import { showToast } from './common/ToastNotification';


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
  const { isBusy: isLoading, error, start, fail, done } = useBusy();
  const [filters, setFilters] = useState<Filters>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
    sepia: 0,
  });
  const [currentCaption, setCurrentCaption] = useState<string | null>(null);

  const handleImageUpload = useCallback((imageData: ImageData) => {
    setOriginalImage(imageData);
    setEditedImage(null);
    setPrompt('');
    setCurrentCaption(null);
    resetFilters();
  }, []);

  const handleApplyIA = async () => {
    if (!originalImage || !prompt) return;
    start();
    try {
      resetFilters(); 
      const result = await editImageWithPrompt(originalImage, prompt);
      if (result) {
        setEditedImage(result);
        showToast("Edición IA aplicada con éxito.", "success");
      }
      done();
    } catch (e: any) {
        fail(e.message || "Ocurrió un error en la edición IA.");
        showToast(e.message || "Error al aplicar edición IA.", "error");
    }
  };

  const handleEnhance = async () => {
    if (!originalImage) return;

    // The user will likely want to enhance the LATEST version of the image.
    // If they applied an IA edit, they enhance that. Otherwise, the original.
    const imageToEnhance = editedImage 
      ? {
          base64: editedImage.split(',')[1],
          mimeType: editedImage.substring(editedImage.indexOf(':') + 1, editedImage.indexOf(';')),
          name: originalImage.name
        }
      : originalImage;

    start();
    try {
      resetFilters(); 
      const result = await enhanceImageTo8K(imageToEnhance);
      if (result) {
        setEditedImage(result);
        showToast("Imagen mejorada a 8K con éxito.", "success");
      }
      done();
    } catch (e: any) {
        fail(e.message || "Ocurrió un error al mejorar la imagen.");
        showToast(e.message || "Error al mejorar imagen a 8K.", "error");
    }
  };

  const handleGenerateCaption = async () => {
    const imageToCaption = editedImage 
      ? {
          base64: editedImage.split(',')[1],
          mimeType: editedImage.substring(editedImage.indexOf(':') + 1, editedImage.indexOf(';')),
          name: originalImage!.name
        }
      : originalImage;

    if (!imageToCaption) return;

    start();
    try {
      const caption = await generateImageCaption(imageToCaption);
      setCurrentCaption(caption);
      showToast("Pie de foto generado.", "success");
      done();
    } catch (e: any) {
      fail(e.message || "Ocurrió un error al generar el pie de foto.");
      showToast(e.message || "Error al generar pie de foto.", "error");
    }
  };

  const handleReset = () => {
    setEditedImage(null);
    setCurrentCaption(null);
    resetFilters();
  };

  const resetFilters = () => {
    setFilters({ brightness: 100, contrast: 100, saturate: 100, blur: 0, sepia: 0 });
  };
  
  const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null;
  
  const imageStyle = useMemo(() => ({
    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) blur(${filters.blur}px) sepia(${filters.sepia}%)`
  }), [filters]);
  
  const hasManualEdits = useMemo(() => {
    return filters.brightness !== 100 || filters.contrast !== 100 || filters.saturate !== 100 || filters.blur !== 0 || filters.sepia !== 0;
  }, [filters]);

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
          showToast("Imagen con ediciones manuales descargada.", "success");
        }
      };
      img.src = originalImageUrl;
    } else if (editedImage) { 
      const link = document.createElement('a');
      link.href = editedImage;
      link.download = `editado_ia_${originalImage?.name || 'imagen'}.png`;
      link.click();
      showToast("Imagen con ediciones IA descargada.", "success");
    } else if (originalImageUrl) {
        // If no edits, download original as fallback, useful after upload but before any operation
        const link = document.createElement('a');
        link.href = originalImageUrl;
        link.download = `original_${originalImage?.name || 'imagen'}.png`;
        link.click();
        showToast("Imagen original descargada.", "success");
    }
  };
  
  const handleFilterChange = (filterName: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedImage(null); // Clear IA edited image when manual filters are applied
    setFilters(f => ({ ...f, [filterName]: Number(e.target.value) }));
  };

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
            <ZoomPanImageContainer>
              <BeforeAfterSlider beforeImage={originalImageUrl} afterImage={editedImage} style={imageStyle}/>
            </ZoomPanImageContainer>
          ) : (
            <ZoomPanImageContainer>
              <img src={originalImageUrl!} alt="Original" style={imageStyle} className="max-w-full max-h-full object-contain rounded-lg" />
            </ZoomPanImageContainer>
          )}
          {currentCaption && (
            <div className="image-caption">
              {currentCaption}
            </div>
          )}
        </div>

        <div className="tools-panel avatar-box">
          <div className="panel-header">
            <h2 className="header-logo" style={{textAlign: 'left', margin: '0 0 10px 0', fontSize: '24px'}}>Editor IA Premium</h2>
            <p>Realiza ajustes manuales o describe la edición que deseas con la IA.</p>
            <p className="quote-box" style={{textAlign: 'left', fontSize: '12px', color: 'var(--color-oro)'}}>“Aquí no editas fotos. Editas recuerdos con precisión quirúrgica y poder visual.”</p>
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
              className="btn-legendary"
            >
              <WandIcon />
              <span>{isLoading ? 'Aplicando...' : 'Aplicar IA'}</span>
            </button>
            <button
              onClick={handleEnhance}
              disabled={!originalImage || isLoading}
              className="btn-legendary"
            >
              <EnhanceIcon />
              <span>Mejorar a 8K</span>
            </button>
            <button
              onClick={handleGenerateCaption}
              disabled={!originalImage || isLoading}
              className="btn-legendary"
            >
              <CaptionIcon />
              <span>Pie de Foto IA</span>
            </button>
            <div className="button-group">
              <button onClick={handleReset} disabled={!originalImage || isLoading} className="btn-legendary">
                <ResetIcon />
                <span>Reiniciar</span>
              </button>
              <button onClick={handleDownload} disabled={(!editedImage && !hasManualEdits && !originalImage) || isLoading} className="btn-legendary">
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