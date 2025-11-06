import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ImageData } from '../../components/types';
import { restorePhoto, correctDictatedText } from '../../services/geminiService';
import ImageUploader from '../../components/ImageUploader';
import BeforeAfterSlider from '../../components/BeforeAfterSlider';
import { WandIcon, DownloadIcon, ResetIcon, MicIcon, MicOffIcon, PhotoIcon, FullscreenIcon } from '../../components/Iconos';
import { useBusy } from '../../hooks/useBusy';
import '../../styles/NoirPremium.css';

// Add type definitions for the Web Speech API to fix TypeScript errors.
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

const Toggle: React.FC<{id: string, label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled: boolean}> = 
({id, label, checked, onChange, disabled}) => (
    <div className="toggle-control">
        <label htmlFor={id}>{label}</label>
        <label className="toggle-switch">
            <input type="checkbox" id={id} checked={checked} onChange={onChange} disabled={disabled} />
            <span className="toggle-slider"></span>
        </label>
    </div>
);

const RestauracionIA: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [enhanceQuality, setEnhanceQuality] = useState<boolean>(true);
  const [focusOnFaces, setFocusOnFaces] = useState<boolean>(true);
  const [addWatermark, setAddWatermark] = useState<boolean>(true);
  const [isLoading, runTask, error] = useBusy();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [zoom, setZoom] = useState(1);
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
    setRestoredImage(null);
    setPrompt('');
    setZoom(1);
  }, []);

  const handleRestore = () => {
    if (!originalImage) return;
    runTask(async () => {
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
            ctx.font = `500 ${fontSize}px Lora`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 5;
            ctx.fillText("Restaurado con OmniPhoto Studio Pro", canvas.width - 15, canvas.height - 15);
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
      setZoom(1);
  };

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
  
  const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null;
  const imageStyle = { transform: `scale(${zoom})` };

  return (
    <div className="editor-root">
      <div className="editor-workspace">
        <div ref={imageAreaRef} className="image-area">
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Restaurando imagen...</p>
            </div>
          )}
          {!originalImage ? (
            <div className="text-center text-brand-text-muted w-full h-full flex flex-col items-center justify-center p-8">
                <PhotoIcon />
                <h3 className="text-xl font-semibold mt-4 text-brand-text">Módulo de Restauración IA</h3>
                <p className="mt-2 mb-6 max-w-sm">Sube una fotografía dañada, antigua o de baja calidad para que la IA la repare y mejore con un realismo impecable.</p>
                <div className="w-full max-w-md">
                    <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
                </div>
            </div>
          ) : (
            <>
              <div className="image-pan-container">
                {restoredImage && originalImageUrl ? (
                    <BeforeAfterSlider beforeImage={originalImageUrl} afterImage={restoredImage} />
                ) : (
                    <img src={originalImageUrl!} alt="Original" style={imageStyle} />
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
            <h2 className="text-hover">Panel de Restauración</h2>
            <p>Ajusta las opciones y añade instrucciones para guiar a la IA en la reparación de tu foto.</p>
          </div>

          <div className="panel-section">
            <label className="panel-section-title">
              Instrucciones Adicionales
            </label>
            <div className="relative">
                <textarea
                  className="prompt-area pr-12"
                  placeholder="Ej: 'reconstruye la esquina superior izquierda', 'aclara el rostro de la mujer'..."
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
          </div>
          
          <div className="flex flex-col gap-3">
             <Toggle id="focus-on-faces-restore" label="Enfoque en Restauración Facial" checked={focusOnFaces} onChange={(e) => setFocusOnFaces(e.target.checked)} disabled={isLoading} />
             <Toggle id="enhance-quality-restore" label="Mejorar a Calidad Ultra (8K)" checked={enhanceQuality} onChange={(e) => setEnhanceQuality(e.target.checked)} disabled={isLoading} />
             <Toggle id="add-watermark-restore" label="Añadir firma de autor" checked={addWatermark} onChange={(e) => setAddWatermark(e.target.checked)} disabled={isLoading} />
          </div>
          
          {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}

          <div className="panel-footer">
            <button
              onClick={handleRestore}
              disabled={!originalImage || isLoading}
              className="btn-noir-primary"
            >
              <WandIcon />
              <span>{isLoading ? 'Restaurando...' : 'Restaurar Foto'}</span>
            </button>
            <div className="button-group">
              <button
                onClick={handleReset}
                disabled={!originalImage || isLoading}
                className="btn-noir-secondary"
              >
                <ResetIcon />
                <span>Limpiar</span>
              </button>
              <button
                onClick={handleDownload}
                disabled={!restoredImage || isLoading}
                className="btn-noir-secondary"
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