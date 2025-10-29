import React, { useState, useEffect } from 'react';
import { generateVideo, VideoGenerationStatus } from '../services/veoService';

// Icon for the placeholder
const IconVideoExperiencePlaceholder = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>;

const loadingMessages = [
    "Inicializando motor de video VEO...",
    "Componiendo la escena pixel por pixel...",
    "Renderizando fotogramas clave...",
    "Aplicando filtros cinematográficos...",
    "La IA está trabajando en tu obra maestra...",
    "Este proceso puede tardar unos minutos, ¡la espera valdrá la pena!",
    "Ajustando la iluminación y las sombras...",
    "Sincronizando el movimiento...",
];

const VideoExperience: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('Un astronauta montando a caballo en Marte, estilo fotorrealista.');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [status, setStatus] = useState<VideoGenerationStatus | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    
    useEffect(() => {
        const checkKey = async () => {
            if(window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            }
        };
        checkKey();
    }, []);

    useEffect(() => {
        let interval: number;
        if (isGenerating && (status?.status === 'polling' || status?.status === 'generating')) {
            interval = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isGenerating, status]);


    const handleSelectKey = async () => {
        if(window.aistudio) {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
            setError(null);
        }
    };

    const handleGenerateVideo = async () => {
        if (!prompt.trim() || isGenerating) return;

        if (!apiKeySelected) {
            setError('Por favor, selecciona una API Key para continuar.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setVideoUrl(null);
        setStatus(null);

        try {
            const generatedUrl = await generateVideo(
                { prompt, aspectRatio, resolution },
                (update) => setStatus(update)
            );
            setVideoUrl(generatedUrl);
        } catch (err) {
            if (err instanceof Error && err.message === 'API_KEY_INVALID') {
                setError('La API Key seleccionada no es válida o no tiene acceso. Por favor, selecciona otra.');
                setApiKeySelected(false); // Reset key state
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Ocurrió un error desconocido.');
            }
        } finally {
            setIsGenerating(false);
            setStatus(null);
        }
    };
    
    return (
        <div className="container mx-auto max-w-5xl pt-16 md:pt-0 animate-fade-in">
            <header className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif">
                    Hidalgo<span className="text-brand-accent">Video</span> Experience
                </h1>
                <p className="text-brand-text-secondary mt-2 font-sans">
                    Transforma tus ideas en videos de alta calidad con el poder del modelo VEO de Google.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Controls Panel */}
                <div className="lg:col-span-2 bg-brand-secondary p-6 rounded-xl shadow-2xl flex flex-col gap-4">
                    <div>
                        <label className="font-medium text-gray-300 text-sm">Describe tu video</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ej: Un dron volando sobre una ciudad futurista de noche..."
                            className="w-full h-32 mt-1 p-3 bg-brand-primary border border-gray-600 rounded-lg text-brand-text focus:ring-2 focus:ring-brand-accent transition-colors"
                            disabled={isGenerating}
                        />
                    </div>
                     <div>
                        <label className="font-medium text-gray-300 text-sm">Relación de Aspecto</label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <button onClick={() => setAspectRatio('16:9')} disabled={isGenerating} className={`py-2 rounded-lg transition-colors ${aspectRatio === '16:9' ? 'bg-brand-accent text-brand-primary' : 'bg-brand-primary'}`}>16:9 Horizontal</button>
                            <button onClick={() => setAspectRatio('9:16')} disabled={isGenerating} className={`py-2 rounded-lg transition-colors ${aspectRatio === '9:16' ? 'bg-brand-accent text-brand-primary' : 'bg-brand-primary'}`}>9:16 Vertical</button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="resolution" className="font-medium text-gray-300 text-sm">Resolución</label>
                         <select id="resolution" value={resolution} onChange={(e) => setResolution(e.target.value as '720p' | '1080p')} disabled={isGenerating} className="w-full p-2 mt-1 bg-brand-primary border border-gray-600 rounded-lg text-brand-text focus:ring-2 focus:ring-brand-accent">
                            <option value="720p">720p (Rápido)</option>
                            <option value="1080p">1080p (Alta Calidad)</option>
                        </select>
                    </div>
                    
                    {!apiKeySelected ? (
                        <div className="text-center bg-brand-primary p-4 rounded-lg">
                           <p className="text-sm text-brand-text-secondary mb-2">Se requiere una API Key para usar VEO.</p>
                           <button onClick={handleSelectKey} className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-brand-accent-hover transition-transform transform hover:scale-105">
                                Seleccionar API Key
                           </button>
                           <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent mt-2 block hover:underline">Información de facturación</a>
                        </div>
                    ) : (
                         <button
                            onClick={handleGenerateVideo}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-brand-accent-hover transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Generando...
                                </>
                            ) : ( '🎬 Generar Video' )}
                        </button>
                    )}
                </div>
                
                {/* Video Display Area */}
                <div className="lg:col-span-3">
                    <div className="w-full aspect-video bg-brand-secondary rounded-xl shadow-lg flex flex-col items-center justify-center p-2">
                        {isGenerating && (
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-accent"></div>
                                <p className="text-brand-text-secondary mt-4 font-medium">{status?.message || 'Preparando...'}</p>
                                <p className="text-brand-text-secondary mt-2 text-sm animate-pulse">{loadingMessage}</p>
                            </div>
                        )}
                        {videoUrl && !isGenerating && (
                             <video src={videoUrl} controls autoPlay loop className="w-full h-full rounded-lg bg-black" />
                        )}
                        {!videoUrl && !isGenerating && (
                            <div className="flex flex-col items-center justify-center text-center text-brand-text-secondary p-8 border-2 border-dashed border-gray-600 rounded-xl w-full h-full">
                                <IconVideoExperiencePlaceholder />
                                <p className="mt-4">El video generado aparecerá aquí.</p>
                            </div>
                        )}
                    </div>
                     {videoUrl && !isGenerating && (
                         <a href={videoUrl} download={`${prompt.slice(0, 30).replace(/\s/g, '_') || 'video'}.mp4`} className="mt-2 w-full block text-center bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-brand-accent-hover text-sm transition-colors">
                            Descargar Video
                         </a>
                     )}
                     {error && (
                        <div className="mt-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoExperience;