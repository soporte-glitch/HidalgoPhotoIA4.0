

import React, { useState } from 'react';
import { generateImageFromText } from '../services/geminiService';
import { WandIcon, DownloadIcon } from './Iconos';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const imageUrl = await generateImageFromText(prompt);
            setGeneratedImage(imageUrl);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al generar la imagen.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `generado_${prompt.substring(0, 20).replace(/\s/g, '_')}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow flex items-center justify-center bg-brand-secondary rounded-xl p-4 shadow-lg mb-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-accent"></div>
                        <p className="text-brand-text-secondary mt-4">Generando tu obra de arte...</p>
                    </div>
                )}
                {!isLoading && generatedImage && (
                    <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain rounded-lg" loading="lazy" />
                )}
                {!isLoading && !generatedImage && (
                     <div className="text-center text-brand-text-secondary">
                        <h2 className="text-2xl font-semibold mb-2">Generador de Imágenes IA</h2>
                        <p>Escribe una descripción y la IA creará una imagen única para ti.</p>
                     </div>
                )}
            </div>
            <div className="flex-shrink-0 bg-brand-primary p-4 rounded-xl shadow-lg">
                <div className="flex gap-4">
                    <textarea
                        rows={2}
                        className="flex-grow bg-brand-secondary border border-brand-secondary rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
                        placeholder="Ej: 'un astronauta montando a caballo en marte, estilo fotorrealista'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={!prompt || isLoading}
                        className="bg-gradient-to-br from-brand-secondary to-brand-highlight border border-brand-accent text-brand-text font-bold py-3 px-6 rounded-lg shadow-[0_0_10px_rgba(203,178,106,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:scale-105 hover:enabled:text-brand-accent-hover flex items-center"
                    >
                        <WandIcon />
                        <span className="ml-2 hidden sm:inline">{isLoading ? 'Generando...' : 'Generar'}</span>
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!generatedImage || isLoading}
                        className="bg-brand-secondary text-brand-text font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center"
                    >
                       <DownloadIcon />
                       <span className="ml-2 hidden sm:inline">Descargar</span>
                    </button>
                </div>
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            </div>
        </div>
    );
};

export default ImageGenerator;