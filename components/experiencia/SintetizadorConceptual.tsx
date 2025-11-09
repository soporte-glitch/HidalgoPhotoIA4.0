import React, { useState, useCallback } from 'react';
import type { ImageData } from '../types';
import { useBusy } from '../../hooks/useBusy';
import { synthesizeConcepts } from '../../services/geminiService';
import ImageUploader from '../ImageUploader';
import { WandIcon, DownloadIcon, ResetIcon } from '../Iconos';

const SintetizadorConceptual: React.FC = () => {
    const [image1, setImage1] = useState<ImageData | null>(null);
    const [image2, setImage2] = useState<ImageData | null>(null);
    const [prompt, setPrompt] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const { isBusy: isLoading, error, runTask } = useBusy();

    const handleSynthesize = useCallback(() => {
        if (!image1 || !image2 || !prompt) return;
        runTask(async () => {
            const result = await synthesizeConcepts(image1, image2, prompt);
            setResultImage(result);
        });
    }, [image1, image2, prompt, runTask]);

    const handleReset = useCallback(() => {
        setImage1(null);
        setImage2(null);
        setPrompt('');
        setResultImage(null);
    }, []);
    
    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `sintesis_conceptual.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="h-full flex flex-col-reverse lg:flex-row gap-6 p-2">
            <div className="w-full lg:w-[450px] flex-shrink-0">
                <div className="avatar-box flex flex-col h-full">
                    <div className="panel-header">
                        <h2 className="header-logo" style={{textAlign: 'left', margin: '0 0 10px 0', fontSize: '22px'}}>Sintetizador Conceptual</h2>
                        <p className="text-sm">Fusiona la esencia de dos imágenes a través de un concepto para crear algo completamente nuevo.</p>
                        <p className="quote-box" style={{textAlign: 'left', fontSize: '12px', color: 'var(--color-oro)'}}>“No mezcles pixeles. Sintetiza realidades.”</p>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 space-y-4 pt-4">
                        <div>
                            <label className="panel-section-title">IMAGEN DE ANCLAJE 1</label>
                            <div className="h-40">
                                {image1 ? (
                                    <div className="relative group w-full h-full">
                                        <img src={`data:${image1.mimeType};base64,${image1.base64}`} alt="Anclaje 1" className="w-full h-full object-cover rounded-lg"/>
                                        <button onClick={() => setImage1(null)} disabled={isLoading} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                    </div>
                                ) : <ImageUploader onImageUpload={setImage1} disabled={isLoading} />}
                            </div>
                        </div>
                        <div>
                            <label className="panel-section-title">IMAGEN DE ANCLAJE 2</label>
                            <div className="h-40">
                                {image2 ? (
                                    <div className="relative group w-full h-full">
                                        <img src={`data:${image2.mimeType};base64,${image2.base64}`} alt="Anclaje 2" className="w-full h-full object-cover rounded-lg"/>
                                        <button onClick={() => setImage2(null)} disabled={isLoading} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                    </div>
                                ) : <ImageUploader onImageUpload={setImage2} disabled={isLoading} />}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="synth-prompt" className="panel-section-title">PROMPT CATALIZADOR</label>
                            <textarea id="synth-prompt" rows={3} className="prompt-area"
                                placeholder="Ej: 'El tiempo como una entidad cósmica', 'Un bosque donde la tecnología y la naturaleza son uno'..."
                                value={prompt} onChange={e => setPrompt(e.target.value)} disabled={isLoading} />
                        </div>
                    </div>
                    
                    <div className="mt-auto space-y-3 pt-4 border-t border-plata">
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <button onClick={handleSynthesize} disabled={!image1 || !image2 || !prompt || isLoading} className="btn-legendary w-full">
                            <WandIcon />
                            <span>{isLoading ? 'Sintetizando...' : 'Sintetizar Concepto'}</span>
                        </button>
                        <div className="flex space-x-3">
                            <button onClick={handleReset} disabled={isLoading} className="btn-legendary"><ResetIcon /><span>Limpiar</span></button>
                            <button onClick={handleDownload} disabled={!resultImage || isLoading} className="btn-legendary"><DownloadIcon /><span>Descargar</span></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-xl p-4 border border-white/10">
                {isLoading && (
                    <div className="text-center">
                        <div className="spinner"></div>
                        <p className="mt-4">Compilando nueva realidad...</p>
                    </div>
                )}
                {!isLoading && !resultImage && (
                    <div className="text-center text-white/50 p-8">
                        <span className="text-6xl">⚛️</span>
                        <h2 className="text-2xl font-semibold mt-4 mb-2">La Singularidad Visual aparecerá aquí</h2>
                        <p>Proporciona dos anclajes visuales y un concepto catalizador.</p>
                    </div>
                )}
                {!isLoading && resultImage && (
                     <img src={resultImage} alt="Resultado Sintetizado" className="max-w-full max-h-full object-contain rounded-lg" />
                )}
            </div>
        </div>
    );
};

export default SintetizadorConceptual;
