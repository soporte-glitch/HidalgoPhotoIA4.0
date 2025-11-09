import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { ImageData } from '../types';
import ImageUploader from '../ImageUploader';
import { DownloadIcon, WandIcon, MicIcon, MicOffIcon } from '../Iconos';
import { useBusy } from '../../hooks/useBusy';
import { generateVideoFromImage } from '../../services/veoService';
import { generateTextVariations, correctDictatedText } from '../../services/geminiService';
import type { VideoGenerationStatus } from '../../services/veoService';

interface SpeechRecognition extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  onend: (() => void) | null; onerror: ((event: any) => void) | null; onresult: ((event: any) => void) | null;
  start: () => void; stop: () => void; abort: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

type AspectRatio = '9:16' | '16:9';

const FORMAT_OPTIONS: { name: string; value: AspectRatio, icon: string }[] = [
    { name: 'Reels / Story', value: '9:16', icon: '📱' },
    { name: 'Anuncio Horizontal', value: '16:9', icon: '📺' },
];

const PromoSocial: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<ImageData | null>(null);
  const [promoText, setPromoText] = useState('¡Gran Inauguración! ✨');
  const [selectedFormat, setSelectedFormat] = useState<AspectRatio>('9:16');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [status, setStatus] = useState<VideoGenerationStatus>({ status: 'pending', message: 'Listo para generar.' });
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const { isBusy: isLoading, error, start, fail, done, clearError } = useBusy();
  const [suggestedTexts, setSuggestedTexts] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const isGenerating = isLoading || status.status === 'generating' || status.status === 'polling';
  const isVeoBusy = status.status === 'generating' || status.status === 'polling';

    useEffect(() => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'es-ES';
  
          recognition.onresult = (event) => {
              const transcript = event.results[event.results.length - 1][0].transcript;
              setPromoText(prev => prev ? `${prev} ${transcript}` : transcript);
          };
  
          recognition.onend = () => setIsListening(false);
          recognition.onerror = (event) => {
              console.error('Error en reconocimiento de voz:', event.error);
              setIsListening(false);
          };
          recognitionRef.current = recognition;
      }
      checkApiKey();
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
    
    const handleCorrectText = async () => {
        if (!promoText) return;
        start();
        try {
            const corrected = await correctDictatedText(promoText);
            if (corrected) setPromoText(corrected);
            done();
        } catch (e: any) {
            fail(e.message || 'Error al corregir texto.');
        }
    };

  const checkApiKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
          setApiKeySelected(true);
      } else {
          setApiKeySelected(false);
      }
  };
    
  const handleSelectKey = async () => {
      if (window.aistudio) {
          await window.aistudio.openSelectKey();
          setApiKeySelected(true);
      }
  };

  const handleImageUpload = useCallback((imageData: ImageData) => {
    setSourceImage(imageData);
    setVideoUrl(null);
    setVideoError(false);
  }, []);

  const handleGenerateVideo = async () => {
    if (!sourceImage) return;
    clearError();
    setVideoUrl(null);
    setVideoError(false);
    start();
    try {
        const fullPrompt = `${promoText}. Crea una animación de video sutil y elegante a partir de la imagen proporcionada.`;
        const url = await generateVideoFromImage(sourceImage, {
            prompt: fullPrompt,
            aspectRatio: selectedFormat,
            resolution: '720p'
        }, setStatus);
        setVideoUrl(url);
        done();
    } catch (err: any) {
        fail(err.message || 'Error desconocido');
        if (err.message === "API_KEY_INVALID") {
            setStatus({status: 'error', message: 'Clave de API no válida.'});
            setApiKeySelected(false);
        } else {
            setStatus({status: 'error', message: 'Error en la generación.'});
        }
    }
  };
  
  const handleSuggestTexts = async () => {
      start();
      try {
          const variations = await generateTextVariations(promoText);
          setSuggestedTexts(variations);
          done();
      } catch (e: any) {
          fail(e.message || 'Error al sugerir textos.');
      }
  }

  if (!apiKeySelected) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <h2 className="text-3xl font-bold mb-3">Se requiere una Clave de API de VEO</h2>
            <p className="max-w-md mb-6">Para generar videos, debes seleccionar una clave de API habilitada. El uso de VEO puede incurrir en costos.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="hover:underline mb-6" style={{color: 'var(--color-oro)'}}>Más información sobre facturación</a>
            <button onClick={handleSelectKey} className="btn-legendary">Seleccionar Clave de API</button>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-2">
      <div className="w-full lg:w-[420px] flex-shrink-0">
        <div className="avatar-box flex flex-col h-full">
            <h2 className="header-logo" style={{textAlign: 'left', margin: '0 0 10px 0', fontSize: '22px'}}>Creador de Reels y Anuncios</h2>
            <div className="h-48 mb-4">
                <ImageUploader onImageUpload={handleImageUpload} disabled={isGenerating} />
            </div>
            
            <div className="mb-4">
                <label htmlFor="promo-text" className="panel-section-title">Texto del Anuncio</label>
                 <div className="relative">
                    <textarea
                        id="promo-text"
                        rows={3}
                        className="prompt-area pr-12"
                        value={promoText}
                        onChange={(e) => setPromoText(e.target.value)}
                        disabled={isGenerating}
                    />
                    <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                        <button onClick={toggleListen} disabled={isGenerating || !recognitionRef.current} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20'}`} title={isListening ? 'Detener dictado' : 'Dictar por voz'}>
                            {isListening ? <MicOffIcon /> : <MicIcon />}
                        </button>
                        <button onClick={handleCorrectText} disabled={isGenerating || isListening || !promoText} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50" title="Corregir texto con IA">
                            <WandIcon />
                        </button>
                    </div>
                 </div>
                 <button onClick={handleSuggestTexts} disabled={!promoText || isGenerating} className="btn-legendary w-full mt-2 text-sm">
                    ✨ {isLoading && !isVeoBusy ? 'Pensando...' : 'Sugerir Textos con IA'}
                </button>
                {suggestedTexts.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {suggestedTexts.map((text, i) => (
                            <div key={i} onClick={() => setPromoText(text)} className="p-2 bg-black/20 rounded-md text-sm cursor-pointer hover:bg-black/40">
                                {text}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mb-4">
                 <label className="panel-section-title">Formato de Publicación</label>
                 <div className="grid grid-cols-2 gap-2">
                    {FORMAT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => setSelectedFormat(opt.value)} disabled={isGenerating}
                            className={`btn-legendary ${selectedFormat === opt.value ? 'active' : ''}`}>
                           <span>{opt.icon}</span> {opt.name}
                        </button>
                    ))}
                 </div>
            </div>

            <div className="mt-auto pt-4 border-t border-plata">
                <button onClick={handleGenerateVideo} disabled={!sourceImage || isGenerating} className="btn-legendary w-full">
                    <WandIcon />
                    <span>{isGenerating ? status.message : 'Generar Video'}</span>
                </button>
                {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
            </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-black/20 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-bold mb-4 text-center">Vista Previa del Video</h3>
            <div className="flex-1 flex items-center justify-center">
                 {isGenerating && (
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-oro"></div>
                        <p className="mt-4">{status.message}</p>
                    </div>
                )}
                {!isGenerating && videoUrl && !videoError && (
                    <div className="w-full max-w-md flex flex-col items-center gap-4">
                        <video src={videoUrl} onError={() => setVideoError(true)} controls autoPlay loop className="w-full rounded-lg" />
                        <a href={videoUrl} download={`promo_${selectedFormat}.mp4`} className="btn-legendary w-full max-w-xs">
                           <DownloadIcon /> <span className="ml-2">Descargar Video</span>
                        </a>
                    </div>
                )}
                {!isGenerating && videoError && (
                     <div className="text-center text-red-400 p-4">
                        <h3 className="font-bold">Error al cargar el video</h3>
                        <p className="text-sm">El archivo puede estar corrupto. Intenta generarlo de nuevo.</p>
                    </div>
                )}
                {!isGenerating && !videoUrl && !videoError && (
                     <div className="text-center text-white/50">
                        <p>El video generado aparecerá aquí.</p>
                     </div>
                )}
            </div>
      </div>
    </div>
  );
};

export default PromoSocial;