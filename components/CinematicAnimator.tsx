
import React, { useState, useEffect, useCallback } from 'react';
import { generateVideoFromImage } from '../services/veoService';
import type { VideoGenerationConfig, VideoGenerationStatus } from '../services/veoService';
import type { ImageData } from './types';
import ImageUploader from './ImageUploader';
import { WandIcon, DownloadIcon } from './Iconos';

const CinematicAnimator: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [status, setStatus] = useState<VideoGenerationStatus>({ status: 'pending', message: 'Listo para animar.' });
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
    const [videoError, setVideoError] = useState<boolean>(false);

    const checkApiKey = async () => {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
            setApiKeySelected(true);
        } else {
            setApiKeySelected(false);
        }
    };
    
    useEffect(() => {
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
        }
    };

    const handleImageUpload = useCallback((imageData: ImageData) => {
        setOriginalImage(imageData);
        setVideoUrl(null);
        setError(null);
        setVideoError(false);
    }, []);
    
    const handleGenerate = async () => {
        if (!prompt || !originalImage) return;
        
        setError(null);
        setVideoUrl(null);
        setVideoError(false);
        
        const config: VideoGenerationConfig = { prompt, aspectRatio, resolution };

        try {
            const url = await generateVideoFromImage(originalImage, config, setStatus);
            setVideoUrl(url);
        } catch (err: any) {
            if (err.message === "API_KEY_INVALID") {
                setError("La clave de API no es válida o no tiene acceso a VEO. Por favor, selecciona una clave diferente.");
                setApiKeySelected(false);
            } else {
                setError(err.message || "Ocurrió un error inesperado.");
            }
            setStatus({ status: 'error', message: 'Error en la animación.' });
        }
    };
    
    const handleDownload = () => {
        if (!videoUrl) return;
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `animado_${originalImage?.name.split('.')[0] || 'video'}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isLoading = status.status === 'generating' || status.status === 'polling';
    const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base664,${originalImage.base64}` : null;

    if (!apiKeySelected) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-brand-text p-8">
                <h2 className="text-3xl font-bold mb-3 text-white">Se requiere una clave de API de VEO</h2>
                <p className="max-w-md text-brand-text-secondary mb-6">Para usar el Animador Cinemático, debes seleccionar una clave de API habilitada. El uso de VEO puede incurrir en costos.</p>
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
        <div className="h-full flex flex-col lg:flex-row gap-8">
            <div className="flex-1 flex flex-col items-center justify-center bg-brand-secondary rounded-xl p-4 shadow-lg relative">
                {isLoading && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-secondary/90 z-10 rounded-xl">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-accent"></div>
                        <p className="text-brand-text font-semibold mt-4 text-center px-4">{status.message}</p>
                    </div>
                )}
                { videoUrl && !videoError ? (
                     <video src={videoUrl} onError={() => setVideoError(true)} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-lg" />
                ) : videoError ? (
                    <div className="text-center text-red-400 p-4">
                        <h3 className="font-bold">Error al cargar el video</h3>
                        <p className="text-sm">Intenta generarlo de nuevo.</p>
                    </div>
                ) : originalImageUrl ? (
                    <img src={originalImageUrl} alt="Original" className={`max-w-full max-h-full object-contain rounded-lg ${isLoading ? 'opacity-30' : ''}`} />
                ) : (
                    <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
                )}
            </div>

            <div className="w-full lg:w-96 flex flex-col">
                 <div className="bg-brand-primary p-6 rounded-xl shadow-lg flex flex-col h-full">
                    <h2 className="text-xl font-bold text-white mb-4">Panel de Animación</h2>
                    <div className="flex-grow">
                        <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">
                        Describe el movimiento o efecto:
                        </label>
                        <textarea
                            id="prompt"
                            rows={4}
                            className="w-full bg-brand-secondary border border-brand-secondary rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
                            placeholder="Ej: 'el vapor sube lentamente de la taza', 'nieve cayendo suavemente', 'las luces de neón parpadean'..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isLoading || !originalImage}
                        />
                    </div>
                     <div className="flex flex-wrap items-center gap-4 my-4">
                        <div className="flex items-center gap-2">
                            <label className="text-brand-text-secondary text-sm">Aspecto:</label>
                            <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)} disabled={isLoading || !originalImage} className="bg-brand-secondary border border-brand-secondary rounded-md p-2 text-sm">
                                <option value="16:9">16:9</option>
                                <option value="9:16">9:16</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-brand-text-secondary text-sm">Resolución:</label>
                            <select value={resolution} onChange={e => setResolution(e.target.value as any)} disabled={isLoading || !originalImage} className="bg-brand-secondary border border-brand-secondary rounded-md p-2 text-sm">
                                <option value="720p">720p</option>
                                <option value="1080p">1080p</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleGenerate}
                            disabled={!prompt || !originalImage || isLoading}
                            className="w-full flex items-center justify-center bg-gradient-to-br from-brand-secondary to-brand-highlight border border-brand-accent text-brand-text font-bold py-3 px-4 rounded-lg shadow-[0_0_10px_rgba(203,178,106,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:scale-105 hover:enabled:text-brand-accent-hover"
                        >
                            <WandIcon />
                            <span className="ml-2">{isLoading ? 'Animando...' : 'Dar Vida'}</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={!videoUrl || isLoading}
                            className="w-full flex items-center justify-center bg-brand-secondary text-brand-text font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            <DownloadIcon />
                            <span className="ml-2">Descargar Video</span>
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
            </div>
        </div>
    );
};

export default CinematicAnimator;