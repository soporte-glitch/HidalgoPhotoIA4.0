import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { ImageData } from './types';
import { dressForGraduation } from '../services/geminiService';
import type { GraduationOptions } from '../services/geminiService';
import ImageUploader from './ImageUploader';
import { WandIcon, DownloadIcon, ResetIcon } from './Iconos';
import { useBusy } from '../hooks/useBusy';
import '../styles/OmnicorpLegendaryTheme.css';


type Step = 'atuendo' | 'ambiente' | 'ajustes';

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`tab-button ${isActive ? 'active' : ''}`}>{children}</button>
);

const GalleryItem: React.FC<{ label: string; bg: string; isSelected: boolean; onClick: () => void; }> = ({ label, bg, isSelected, onClick }) => (
    <div className={`gallery-item-grad ${isSelected ? 'selected' : ''}`} onClick={onClick} title={label}>
        <div className="preview" style={{ background: bg }}></div>
        <span className="label">{label}</span>
    </div>
);

const Slider: React.FC<{label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled: boolean}> = 
({label, value, onChange, disabled}) => (
  <div className="slider-control">
    <div className="label-row"><span className="label">{label}</span><span className="value">{value}%</span></div>
    <input type="range" min="0" max="200" value={value} onChange={onChange} disabled={disabled} />
  </div>
);

const TOGA_OPTIONS = [ { name: 'Negro', color: '#1a1a1a' }, { name: 'Azul Marino', color: '#000080' }, { name: 'Blanco', color: '#ffffff' }, { name: 'Vino', color: '#722F37' }, { name: 'Beige', color: '#F5F5DC' }];
const SASH_OPTIONS = [ { name: 'Dorado', color: '#FFD700' }, { name: 'Plateado', color: '#C0C0C0' }, { name: 'Azul Rey', color: '#4169E1' }, { name: 'Rojo', color: '#B22222' }, { name: 'Lila', color: '#C8A2C8' } ];
const BACKGROUND_OPTIONS = [ { name: 'Auditorio Elegante', url: 'https://i.imgur.com/kSIT2oW.jpeg' }, { name: 'Biblioteca Académica', url: 'https://i.imgur.com/p1y7GkM.jpeg' }, { name: 'Columnas Clásicas', url: 'https://i.imgur.com/66nI5I1.jpeg' }, { name: 'Estudio Profesional', url: 'https://i.imgur.com/S6Wp3n7.jpeg' }, { name: 'Campus Exterior', url: 'https://i.imgur.com/66nI5I1.jpeg' } ];

const TogasGraduaciones: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { isBusy: isLoading, error, start, fail, done } = useBusy();
  const [activeStep, setActiveStep] = useState<Step>('atuendo');

  // State for options
  const [togaColor, setTogaColor] = useState('Negro');
  const [sashColor, setSashColor] = useState('Dorado');
  const [sashStyle, setSashStyle] = useState<'Tradicional (horizontal)' | 'Tipo "V" (pechera de lujo)'>('Tipo "V" (pechera de lujo)');
  const [background, setBackground] = useState('Auditorio Elegante');
  const [customBackground, setCustomBackground] = useState('');
  const [enhanceQuality, setEnhanceQuality] = useState(true);
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturate: 100 });

  useEffect(() => {
    const wrapElement = document.querySelector('.wrap');
    wrapElement?.classList.add('view-mode-full');
    return () => wrapElement?.classList.remove('view-mode-full');
  }, []);

  const handleGenerate = async () => {
    if (!originalImage) return;
    start();
    try {
      const options: GraduationOptions = { togaColor, sashColor, sashStyle, background, customBackground, enhanceQuality };
      const result = await dressForGraduation(originalImage, options);
      if(result) setGeneratedImage(result);
      done();
    } catch(e: any) {
        fail(e.message || 'Error al generar la foto de graduación.');
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `graduacion_${originalImage?.name || 'imagen'}.png`;
      link.click();
    };
    img.src = generatedImage;
  };
  
  const handleReset = () => {
    setOriginalImage(null);
    setGeneratedImage(null);
    setFilters({ brightness: 100, contrast: 100, saturate: 100 });
  };
  
  const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null;
  const imageFilterStyle = useMemo(() => ({
    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`
  }), [filters]);

  const imageToDisplay = generatedImage || originalImageUrl;

  return (
    <div className="graduation-root">
      <div className="graduation-stage" style={generatedImage ? {} : imageFilterStyle}>
        {!imageToDisplay ? (
          <ImageUploader onImageUpload={setOriginalImage} disabled={isLoading} />
        ) : (
          <img src={imageToDisplay} alt="Graduado" style={{ imageRendering: 'crisp-edges' }} />
        )}
        {isLoading && <div className="loading-overlay"><div className="spinner"></div><p>Creando momento de graduación...</p></div>}
      </div>

      <div className="avatar-box">
        <div className="controls-header">
            <TabButton isActive={activeStep === 'atuendo'} onClick={() => setActiveStep('atuendo')}>1. Atuendo</TabButton>
            <TabButton isActive={activeStep === 'ambiente'} onClick={() => setActiveStep('ambiente')}>2. Ambientación</TabButton>
            <TabButton isActive={activeStep === 'ajustes'} onClick={() => setActiveStep('ajustes')}>3. Ajustes Finos</TabButton>
        </div>
        
        <div className="controls-content">
            {activeStep === 'atuendo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="panel-section-title">Color de Toga</h4>
                        <div className="gallery-grid-5">
                            {TOGA_OPTIONS.map(opt => <GalleryItem key={opt.name} label={opt.name} bg={opt.color} isSelected={togaColor === opt.name} onClick={() => setTogaColor(opt.name)} />)}
                        </div>
                    </div>
                    <div>
                        <h4 className="panel-section-title">Estilo de Banda</h4>
                        <div className="flex gap-2 mb-3">
                            <button className={`btn-legendary ${sashStyle === 'Tipo "V" (pechera de lujo)' ? 'active' : ''}`} onClick={() => setSashStyle('Tipo "V" (pechera de lujo)')}>Tipo "V"</button>
                            <button className={`btn-legendary ${sashStyle === 'Tradicional (horizontal)' ? 'active' : ''}`} onClick={() => setSashStyle('Tradicional (horizontal)')}>Tradicional</button>
                        </div>
                        <div className="gallery-grid-5">
                            {SASH_OPTIONS.map(opt => <GalleryItem key={opt.name} label={opt.name} bg={opt.color} isSelected={sashColor === opt.name} onClick={() => setSashColor(opt.name)} />)}
                        </div>
                    </div>
                </div>
            )}
            {activeStep === 'ambiente' && (
                <div>
                     <h4 className="panel-section-title">Fondo Profesional</h4>
                     <div className="gallery-grid-5">
                        {BACKGROUND_OPTIONS.map(opt => <GalleryItem key={opt.name} label={opt.name} bg={`url(${opt.url}) center/cover`} isSelected={background === opt.name} onClick={() => setBackground(opt.name)} />)}
                     </div>
                </div>
            )}
             {activeStep === 'ajustes' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Slider label="Brillo" value={filters.brightness} onChange={(e) => setFilters(f => ({...f, brightness: +e.target.value}))} disabled={isLoading || !imageToDisplay}/>
                    <Slider label="Contraste" value={filters.contrast} onChange={(e) => setFilters(f => ({...f, contrast: +e.target.value}))} disabled={isLoading || !imageToDisplay}/>
                    <Slider label="Saturación" value={filters.saturate} onChange={(e) => setFilters(f => ({...f, saturate: +e.target.value}))} disabled={isLoading || !imageToDisplay}/>
                </div>
            )}
        </div>
        
        <div className="controls-footer">
            <div className="checkbox-control"><input type="checkbox" id="enhance-grad" checked={enhanceQuality} onChange={e => setEnhanceQuality(e.target.checked)} disabled={isLoading}/><label htmlFor="enhance-grad">Mejorar a Calidad Ultra (8K)</label></div>
            <div className="flex gap-4">
                <button onClick={handleReset} disabled={isLoading} className="btn-legendary"><ResetIcon/>Reiniciar</button>
                <button onClick={handleGenerate} disabled={!originalImage || isLoading} className="btn-legendary flex-grow"><WandIcon/>Generar Foto</button>
                <button onClick={handleDownload} disabled={!generatedImage || isLoading} className="btn-legendary"><DownloadIcon/>Descargar</button>
            </div>
             {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default TogasGraduaciones;