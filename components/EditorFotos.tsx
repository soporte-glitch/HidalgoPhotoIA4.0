import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ImageData } from './types';
import { editImageWithPrompt, correctDictatedText } from '../services/geminiService';
import { useBusy } from '../hooks/useBusy';
import BeforeAfterSlider from './BeforeAfterSlider';
import ImageUploader from './ImageUploader';
import { WandIcon, DownloadIcon, ResetIcon, MicIcon, MicOffIcon, FullscreenIcon, SharpnessIcon } from './Iconos';
import '../styles/NoirPremium.css';

// Add type definitions for the Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onresult: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}


interface Filters {
  brightness: number;
  contrast: number;
  saturate: number;
  blur: number;
  sepia: number;
}

const ARTISTIC_STYLES = [
  { name: 'Óleo', prompt: 'Transforma esta imagen en una pintura al óleo clásica. Aplica pinceladas visibles y con textura, empaste y una paleta de colores rica. El resultado debe emular el trabajo de un maestro del óleo.' },
  { name: 'Acuarela', prompt: 'Convierte esta foto en una pintura de acuarela. Utiliza lavados de color translúcidos, bordes suaves y la textura granulada del papel de acuarela.' },
  { name: 'Cyberpunk', prompt: 'Aplica un estilo visual cyberpunk a esta imagen. Incorpora luces de neón brillantes (especialmente rosas y azules), ambientes urbanos lluviosos y un ambiente de alta tecnología y baja vida.' },
  { name: 'Renacimiento', prompt: 'Reimagina esta imagen como una pintura del Renacimiento. Usa una iluminación de claroscuro dramática, colores profundos y una composición formal que recuerde a los maestros como Caravaggio o Rembrandt.' },
  { name: 'Animación', prompt: 'Convierte esta imagen en una ilustración de estilo animación 2D. Utiliza colores planos y vibrantes, líneas de contorno limpias y un aspecto general de "cel shading".' },
  { name: 'Concept Art', prompt: 'Dale a esta imagen el aspecto de un "concept art" para un videojuego o película. Usa pinceladas expresivas, un enfoque en la atmósfera y un estilo pictórico digital.'}
];


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
  const [addWatermark, setAddWatermark] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
    sepia: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);


   useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error('Error en reconocimiento de voz:', event.error);
            setIsListening(false);
        };
        recognitionRef.current = recognition;
    }
    return () => recognitionRef.current?.abort();
  }, []);

  const toggleListen = () => {
      if (isListening) {
          recognitionRef.current?.stop();
      } else {
          recognitionRef.current?.start();
          setIsListening(true);
      }
  };

  const handleCorrectText = () => {
    if (!prompt) return;
    runTask(async () => {
        const corrected = await correctDictatedText(prompt);
        if (corrected) setPrompt(corrected);
    });
  };


  const handleImageUpload = useCallback((imageData: ImageData) => {
    setOriginalImage(imageData);
    setEditedImage(null);
    setPrompt('');
    resetFilters();
    setZoom(1);
  }, []);

  const handleApplyIA = (iaPrompt: string = prompt) => {
    if (!originalImage || !iaPrompt) return;
    runTask(async () => {
      resetFilters(); 
      const result = await editImageWithPrompt(originalImage, iaPrompt);
      if (result) {
        setEditedImage(result);
      }
    });
  };

  const handleArtisticStyleClick = (stylePrompt: string) => {
    setPrompt(stylePrompt);
    handleApplyIA(stylePrompt);
  };
  
  const handleSharpness = () => {
      handleApplyIA('Aumenta la nitidez y el enfoque de forma fotorrealista, mejorando los detalles sin crear artefactos.');
  }

  const handleReset = () => {
    setEditedImage(null);
    resetFilters();
    setPrompt('');
    setZoom(1);
  };

  const resetFilters = () => {
    setFilters({ brightness: 100, contrast: 100, saturate: 100, blur: 0, sepia: 0 });
  };
  
 const handleDownload = () => {
    const urlToDownload = editedImage || originalImageUrl;
    if (!urlToDownload) return;

    const hasManualEdits = !editedImage && useMemo(() => {
        return filters.brightness !== 100 || filters.contrast !== 100 || filters.saturate !== 100 || filters.blur !== 0 || filters.sepia !== 0;
    }, [filters]);

    const filename = editedImage 
      ? `editado_ia_${originalImage?.name || 'imagen'}.png`
      : `editado_manual_${originalImage?.name || 'imagen'}.png`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (hasManualEdits) {
        ctx.filter = imageStyle.filter || '';
      }
      
      ctx.drawImage(img, 0, 0);
      
      if (addWatermark) {
        const fontSize = Math.max(18, Math.floor(img.naturalWidth / 60));
        ctx.font = `500 ${fontSize}px Lora`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 5;
        ctx.fillText("Editado con OmniPhoto Studio Pro", canvas.width - 15, canvas.height - 15);
      }

      const link = document.createElement('a');
      link.href = canvas.toDataURL(originalImage?.mimeType || 'image/png');
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = urlToDownload;
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
  
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
  const handleZoomFit = () => setZoom(1);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
        imageAreaRef.current?.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
  };


  return (
    <div className="editor-root">
      <div className="editor-workspace">
        <div ref={imageAreaRef} className="image-area">
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Aplicando magia IA...</p>
            </div>
          )}
          {!originalImage ? (
             <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
          ) : (
            <>
                <div className="image-pan-container">
                {editedImage && originalImageUrl ? (
                    <BeforeAfterSlider beforeImage={originalImageUrl} afterImage={editedImage} />
                ) : (
                    <img src={originalImageUrl!} alt="Original" style={{...imageStyle, transform: `scale(${zoom})` }} />
                )}
                </div>
                <div className="image-controls">
                    <div className="zoom-controls">
                        <button onClick={handleZoomOut} title="Alejar">-</button>
                        <span className="zoom-value" onClick={handleZoomFit} title="Ajustar a pantalla" style={{cursor: 'pointer'}}>{Math.round(zoom * 100)}%</span>
                        <button onClick={handleZoomIn} title="Acercar">+</button>
                    </div>
                    <button className="fullscreen-btn" onClick={handleToggleFullscreen} title="Pantalla Completa">
                        <FullscreenIcon />
                    </button>
                </div>
            </>
          )}
        </div>

        <div className="tools-panel">
          <div className="panel-header">
            <h2 className="text-hover">Editor IA Premium</h2>
            <p>Realiza ajustes manuales o describe la edición que deseas con la IA.</p>
          </div>

          <div className="panel-section">
            <label className="panel-section-title">Edición con IA</label>
             <div className="relative">
                <textarea
                  className="prompt-area pr-12"
                  placeholder="Ej: 'cambia el fondo a una playa tropical', 'haz que parezca un cuadro al óleo'..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isLoading}
                />
                 <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                    <button 
                      onClick={toggleListen}
                      disabled={isLoading || !recognitionRef.current}
                      className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                      title={isListening ? 'Detener dictado' : 'Dictar instrucciones'}
                    >
                      {isListening ? <MicOffIcon /> : <MicIcon />}
                    </button>
                    <button
                        onClick={handleCorrectText}
                        disabled={isLoading || isListening || !prompt}
                        className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors disabled:opacity-50"
                        title="Corregir texto con IA"
                    >
                       {isLoading ? <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div> : <WandIcon />}
                    </button>
                 </div>
            </div>
             <div className="grid grid-cols-2 gap-2 mt-2">
                 <button onClick={() => handleApplyIA()} disabled={!originalImage || !prompt || isLoading} className="btn-noir-secondary !flex-grow-0"><WandIcon/>Aplicar IA</button>
                 <button onClick={handleSharpness} disabled={!originalImage || isLoading} className="btn-noir-secondary !flex-grow"><SharpnessIcon/>Enfoque IA</button>
             </div>
          </div>
          
           <div className="panel-section">
            <label className="panel-section-title">Estilo Artístico (IA)</label>
            <div className="grid grid-cols-3 gap-2">
              {ARTISTIC_STYLES.map(style => (
                <button 
                  key={style.name} 
                  onClick={() => handleArtisticStyleClick(style.prompt)} 
                  disabled={!originalImage || isLoading} 
                  className="btn-artistic-style"
                  title={style.prompt}
                >
                  {style.name}
                </button>
              ))}
            </div>
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
            <div className="checkbox-control">
                <input type="checkbox" id="add-watermark-editor" checked={addWatermark} onChange={(e) => setAddWatermark(e.target.checked)} />
                <label htmlFor="add-watermark-editor">Añadir firma de autor</label>
            </div>
            
            <div className="button-group">
              <button onClick={handleReset} disabled={!originalImage || isLoading} className="btn-noir-secondary">
                <ResetIcon />
                <span>Reiniciar</span>
              </button>
              <button onClick={handleDownload} disabled={!originalImage || isLoading} className="btn-noir-secondary">
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