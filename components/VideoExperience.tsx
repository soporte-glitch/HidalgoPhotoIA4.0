
import React, { useState, useEffect, useRef } from 'react';
import { generateVideo } from '../services/veoService';
import type { VideoGenerationConfig, VideoGenerationStatus } from '../services/veoService';
import { WandIcon } from './Iconos';

const VideoExperience: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [status, setStatus] = useState<VideoGenerationStatus>({ status: 'pending', message: 'Listo para generar.' });
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);

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
            // Assume key selection is successful to avoid race conditions.
            setApiKeySelected(true);
        }
    };
    
    const handleGenerate = async () => {
        if (!prompt) return;
        
        setError(null);
        setVideoUrl(null);
        
        const config: VideoGenerationConfig = { prompt, aspectRatio, resolution };

        try {
            const url = await generateVideo(config, setStatus);
            setVideoUrl(url);
        } catch (err: any) {
            if (err.message === "API_KEY_INVALID") {
                setError("La clave de API no es válida o no tiene acceso a VEO. Por favor, selecciona una clave diferente.");
                setApiKeySelected(false); // Reset key selection state
            } else {
                setError(err.message || "Ocurrió un error inesperado.");
            }
            setStatus({ status: 'error', message: 'Error en la generación.' });
        }
    };
    
    const isLoading = status.status === 'generating' || status.status === 'polling';

    if (!apiKeySelected) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-brand-text p-8">
                <h2 className="text-3xl font-bold mb-3 text-white">Se requiere una clave de API</h2>
                <p className="max-w-md text-brand-text-secondary mb-6">Para usar el generador de video VEO, debes seleccionar una clave de API habilitada para el proyecto. El uso de VEO puede incurrir en costos.</p>
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
        <div className="h-full flex flex-col gap-6">
            <div className="flex-grow flex items-center justify-center bg-brand-secondary rounded-xl p-4 shadow-lg relative">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-secondary/90 z-10 rounded-xl">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-accent"></div>
                        <p className="text-brand-text font-semibold mt-4 text-center px-4">{status.message}</p>
                    </div>
                )}
                {videoUrl ? (
                    <video ref={videoRef} src={videoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-lg" />
                ) : (
                    <div className="text-center text-brand-text-secondary">
                        <h2 className="text-2xl font-semibold mb-2">Generador de Video VEO</h2>
                        <p>Escribe una descripción y la IA creará un video de alta calidad.</p>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 bg-brand-primary p-4 rounded-xl shadow-lg">
                <textarea
                    rows={2}
                    className="w-full bg-brand-secondary border border-brand-secondary rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition mb-4"
                    placeholder="Ej: 'Un holograma de neón de un gato conduciendo a toda velocidad'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                />
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-brand-text-secondary text-sm">Aspecto:</label>
                        <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value as any)} disabled={isLoading} className="bg-brand-secondary border border-brand-secondary rounded-md p-2 text-sm">
                            <option value="16:9">16:9 (Paisaje)</option>
                            <option value="9:16">9:16 (Retrato)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-brand-text-secondary text-sm">Resolución:</label>
                        <select value={resolution} onChange={e => setResolution(e.target.value as any)} disabled={isLoading} className="bg-brand-secondary border border-brand-secondary rounded-md p-2 text-sm">
                            <option value="720p">720p</option>
                            <option value="1080p">1080p</option>
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={!prompt || isLoading}
                        className="bg-gradient-to-br from-brand-secondary to-brand-highlight border border-brand-accent text-brand-text font-bold py-2 px-6 rounded-lg shadow-[0_0_10px_rgba(203,178,106,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:scale-105 hover:enabled:text-brand-accent-hover flex items-center ml-auto"
                    >
                        <WandIcon />
                        <span className="ml-2">{isLoading ? 'Generando...' : 'Generar Video'}</span>
                    </button>
                </div>
                 {error && !isLoading && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            </div>
        </div>
    );
};

export default VideoExperience;
