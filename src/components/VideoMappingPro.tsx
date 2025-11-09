import React, { useState, useEffect, useCallback } from 'react';
import type { ImageData } from './types';
import { useBusy } from '../hooks/useBusy';
import { generateVideo } from '../services/veoService'; // Reusing generateVideo for now
import type { VideoGenerationStatus, VideoGenerationConfig } from '../services/veoService';
import ImageUploader from './ImageUploader';
import { WandIcon, DownloadIcon, ResetIcon } from './Iconos';
import ZoomPanImageContainer from './common/ZoomPanImageContainer';
import { showToast } from './common/ToastNotification';


const BACKGROUND_GALLERY_VIDEOMAP = [
  { name: 'Abstracto Energético', url: 'https://i.imgur.com/kSIT2oW.jpeg' }, // Placeholder, use actual abstract patterns
  { name: 'Olas de Neón', url: 'https://i.imgur.com/p1y7GkM.jpeg' },
  { name: 'Fractales Cósmicos', url: 'https://i.imgur.com/66nI5I1.jpeg' },
];


const VideoMappingPro: React.FC = () => {
  const [stageImage, setStageImage] = useState<ImageData | null>(null);
  const [mappingPrompt, setMappingPrompt] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  const [status, setStatus] = useState<VideoGenerationStatus>({ status: 'pending', message: 'Listo para crear mapping.' });
  const { isBusy: isLoading, error, start, fail, done, clearError } = useBusy();
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [videoError, setVideoError] = useState(false);

  // Apply full-viewport mode on mount
  useEffect(() => {
    const wrapElement = document.querySelector('.wrap');
    wrapElement?.classList.add('view-mode-full');
    return () => wrapElement?.classList.remove('view-mode-full');
  }, []);

  useEffect(() => {
    checkApiKey();
  }, []);

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
      setApiKeySelected(true); // Assume success for immediate UI update
      showToast("Clave de API seleccionada. Intentando de nuevo...", "success");
    }
  };

  const handleImageUpload = useCallback((imageData: ImageData) => {
    setStageImage(imageData);
    setGeneratedVideoUrl(null);
    setVideoError(false);
    setMappingPrompt('');
    setSelectedPreset(null);
  }, []);

  const handlePresetSelect = (presetPrompt: string, presetName: string) => {
    setMappingPrompt(presetPrompt);
    setSelectedPreset(presetName);
    setGeneratedVideoUrl(null);
    setVideoError(false);
  };

  const handleGenerateMapping = async () => {
    if (!stageImage && !mappingPrompt) {
        showToast("Sube una imagen o describe el mapping deseado.", "error");
        return;
    }
    clearError();
    setGeneratedVideoUrl(null);
    setVideoError(false);
    start();

    try {
        const fullPrompt = stageImage 
            ? `Crea un video mapping dinámico y abstracto para proyectar sobre la superficie de la imagen. El mapping debe ser: "${mappingPrompt}".`
            : `Crea un video mapping abstracto y dinámico basado en la siguiente descripción: "${mappingPrompt}".`;

        // For now, we'll use generateVideo without an initial image for mapping.
        // A more advanced VisionMap API would take the image to analyze its geometry.
        const config: VideoGenerationConfig = {
            prompt: fullPrompt,
            aspectRatio: '16:9', // Default for video mapping, can be configurable
            resolution: '720p',
        };

        const url = await generateVideo(config, setStatus); // Assuming generateVideo can work with text prompt only
        setGeneratedVideoUrl(url);
        showToast("Video mapping generado con éxito.", "success");
    } catch (err: any) {
        if (err.message === "API_KEY_INVALID") {
            fail("La clave de API no es válida o no tiene acceso a VEO. Por favor, selecciona una clave diferente.");
            setApiKeySelected(false);
            showToast("Error: Clave de API inválida para VEO.", "error");
        } else {
            fail(err.message || "Ocurrió un error inesperado al generar el video mapping.");
            showToast(err.message || "Error al generar video mapping.", "error");
        }
        setStatus({ status: 'error', message: 'Error en la generación del mapping.' });
    }
    done();
  };

  const handleDownload = () => {
    if (!generatedVideoUrl) return;
    const link = document.createElement('a');
    link.href = generatedVideoUrl;
    link.download = `videomapping_${mappingPrompt.substring(0, 20).replace(/\s/g, '_')}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Video mapping descargado.", "success");
  };

  const handleReset = () => {
    setStageImage(null);
    setMappingPrompt('');
    setGeneratedVideoUrl(null);
    setSelectedPreset(null);
    setVideoError(false);
    clearError();
    setStatus({ status: 'pending', message: 'Listo para crear mapping.' });
  };

  const isGenerating = isLoading || status.status === 'generating' || status.status === 'polling';
  const stageImageUrl = stageImage ? `data:${stageImage.mimeType};base64,${stageImage.base64}` : null;

  if (!apiKeySelected) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-brand-text p-8">
            <h2 className="text-3xl font-bold mb-3 text-white">Se requiere una clave de API de VEO</h2>
            <p className="max-w-md text-brand-text-secondary mb-6">Para usar Video Mapping Pro, debes seleccionar una clave de API habilitada. El uso de VEO puede incurrir en costos.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline mb-6">
                Más información sobre la facturación
            </a>
            <button
                onClick={handleSelectKey}
                className="bg-gradient-to-br from-brand-secondary to-brand-highlight border border-brand-accent text-brand-text font-bold py-3 px-6 rounded-lg shadow-[0_0_10px_rgba(203,178,106,0.4)] transition-all hover:enabled:scale-105 hover:enabled:text-brand-accent-hover"
            >
                Seleccionar Clave de API
            </button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-8 p-2">
      {/* Panel Izquierdo: Visualización y Controles */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-xl p-4 border border-white/10 relative">
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 rounded-xl">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-oro"></div>
            <p className="text-white/80 mt-4">{status.message}</p>
          </div>
        )}
        {generatedVideoUrl && !videoError ? (
          <ZoomPanImageContainer className="w-full h-full">
            <video src={generatedVideoUrl} onError={() => setVideoError(true)} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-lg" />
          </ZoomPanImageContainer>
        ) : videoError ? (
          <div className="text-center text-red-400 p-4">
            <h3 className="font-bold">Error al cargar el video</h3>
            <p className="text-sm">El archivo puede estar corrupto. Intenta generarlo de nuevo.</p>
          </div>
        ) : stageImageUrl ? (
          <ZoomPanImageContainer className="w-full h-full">
            <img src={stageImageUrl} alt="Escenario Base" className={`max-w-full max-h-full object-contain rounded-lg ${isGenerating ? 'opacity-30' : ''}`} />
          </ZoomPanImageContainer>
        ) : (
          <div className="text-center text-white/50 p-8">
            <span className="text-6xl">✨🔮</span>
            <h2 className="text-2xl font-semibold mt-4 mb-2">Tu Video Mapping aparecerá aquí</h2>
            <p>Sube una imagen de tu escenario o usa un preset para empezar.</p>
          </div>
        )}
      </div>

      {/* Panel Derecho: Controles y Opciones */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <div className="avatar-box flex flex-col h-full">
          <div className="panel-header">
            <h2 className="header-logo" style={{textAlign: 'left', margin: '0 0 10px 0', fontSize: '24px'}}>Video Mapping Pro</h2>
            <p className="text-sm">Crea proyecciones dinámicas e inmersivas con IA para cualquier superficie.</p>
            <p className="quote-box" style={{textAlign: 'left', fontSize: '12px', color: 'var(--color-oro)'}}>“Transfórmate en un arquitecto de la luz. Convierte cualquier superficie en un lienzo de magia visual.”</p>
          </div>

          <div className="flex-grow overflow-y-auto pr-2 space-y-4 pt-4">
            <div>
              <label className="panel-section-title">1. IMAGEN DE ESCENARIO (Opcional)</label>
              <div className="h-40">
                {stageImage ? (
                  <div className="relative group w-full h-full">
                    <img src={stageImageUrl!} alt="Escenario" className="w-full h-full object-cover rounded-lg"/>
                    <button onClick={() => setStageImage(null)} disabled={isGenerating} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                  </div>
                ) : <ImageUploader onImageUpload={handleImageUpload} disabled={isGenerating} />}
              </div>
            </div>

            <div>
              <label htmlFor="mapping-prompt" className="panel-section-title">2. DESCRIBE TU EFECTO</label>
              <textarea
                id="mapping-prompt"
                rows={3}
                className="prompt-area"
                placeholder="Ej: 'Partículas de luz que danzan al ritmo de la música', 'Texturas orgánicas que fluyen y se transforman', 'Geometrías abstractas en constante movimiento'..."
                value={mappingPrompt}
                onChange={e => setMappingPrompt(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="panel-section-title">3. O SELECCIONA UN PRESET</label>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUND_GALLERY_VIDEOMAP.map(preset => (
                  <div 
                    key={preset.name} 
                    className={`gallery-item-videomap ${selectedPreset === preset.name ? 'selected' : ''}`} 
                    onClick={() => handlePresetSelect(preset.name, preset.name)}
                  >
                    <img src={preset.url} alt={preset.name} />
                    <span className="label">{preset.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-auto space-y-3 pt-4 border-t border-plata">
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={handleGenerateMapping} disabled={(!stageImage && !mappingPrompt) || isGenerating} className="btn-legendary w-full">
              <WandIcon />
              <span>{isGenerating ? status.message : 'Generar Video Mapping'}</span>
            </button>
            <div className="flex space-x-3">
              <button onClick={handleReset} disabled={isGenerating} className="btn-legendary"><ResetIcon /><span>Limpiar</span></button>
              <button onClick={handleDownload} disabled={!generatedVideoUrl || isGenerating} className="btn-legendary"><DownloadIcon /><span>Descargar</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoMappingPro;