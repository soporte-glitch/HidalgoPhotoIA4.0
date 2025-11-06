import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { ImageData } from './types';
import { stitchPanorama, removeBackground, replaceBackground, generateImageFromText, editImageWithPrompt, correctDictatedText } from '../services/geminiService';
import { WandIcon, DownloadIcon, ResetIcon, MicIcon, MicOffIcon, FullscreenIcon, UploadIcon, BrightnessIcon, ContrastIcon, SaturationIcon } from './Iconos';
import { useBusy } from '../hooks/useBusy';
import ImageUploader from './ImageUploader';
import '../styles/NoirPremium.css';

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

const BACKGROUND_GALLERY = [
    { name: 'Playa Tropical', url: 'https://i.imgur.com/example1.jpg', prompt: 'una playa tropical al atardecer con palmeras y agua cristalina, fotorrealista, 8k' },
    { name: 'Ciudad Nocturna', url: 'https://i.imgur.com/example2.jpg', prompt: 'una ciudad futurista por la noche con rascacielos de neón y coches voladores, estilo cyberpunk, 8k' },
    { name: 'Bosque Encantado', url: 'https://i.imgur.com/example3.jpg', prompt: 'un bosque encantado con árboles milenarios, rayos de luz solar atravesando el dosel y un arroyo brillante, fantasía, 8k' },
];

const PanoramaPro: React.FC = () => {
    const [sourceImages, setSourceImages] = useState<ImageData[]>([]);
    const [panoramaImage, setPanoramaImage] = useState<ImageData | null>(null);
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [isLoading, runTask, error] = useBusy();
    const [prompt, setPrompt] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const imageAreaRef = useRef<HTMLDivElement>(null);
    const [backgroundUploaderVisible, setBackgroundUploaderVisible] = useState(false);
    const [galleryVisible, setGalleryVisible] = useState(false);
    
    const stage: 'upload' | 'stitched' | 'edited' = !panoramaImage ? 'upload' : (finalImage === `data:${panoramaImage.mimeType};base64,${panoramaImage.base64}` ? 'stitched' : 'edited');

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-ES';
            recognition.onresult = (event) => setPrompt(p => p + event.results[event.results.length - 1][0].transcript);
            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }
    }, []);

    const handleFilesUpload = useCallback((files: File[]) => {
        handleReset();
        const imagePromises = files.filter(f => f.type.startsWith('image/')).map(file => 
            new Promise<ImageData>(resolve => {
                const reader = new FileReader();
                reader.onload = e => {
                    const base64 = (e.target?.result as string).split(',')[1];
                    resolve({ base64, mimeType: file.type, name: file.name });
                };
                reader.readAsDataURL(file);
            })
        );
        Promise.all(imagePromises).then(setSourceImages);
    }, []);

    const handleStitch = async () => {
        if (sourceImages.length < 2) return;
        runTask(async () => {
            // Fix: Provide missing arguments to stitchPanorama function call. Pass the existing 'prompt' state for user instructions and set 'enhanceQuality' to true as a default.
            const resultUrl = await stitchPanorama(sourceImages, prompt, true);
            const blob = await fetch(resultUrl).then(r => r.blob());
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = (reader.result as string).split(',')[1];
                const stitchedImageData = { base64: base64data, mimeType: blob.type, name: `panorama.png` };
                setPanoramaImage(stitchedImageData);
                setFinalImage(`data:${stitchedImageData.mimeType};base64,${stitchedImageData.base64}`);
            };
        });
    };

    const handleRemoveBg = () => {
        if (!panoramaImage) return;
        runTask(async () => {
            const result = await removeBackground(panoramaImage);
            setFinalImage(result);
        });
    };
    
    const handleReplaceBg = (bgImage: ImageData) => {
        if (!panoramaImage) return;
        runTask(async () => {
            const result = await replaceBackground(panoramaImage, bgImage);
            setFinalImage(result);
        });
        setBackgroundUploaderVisible(false);
        setGalleryVisible(false);
    }
    
    const handleGenerateBgFromGallery = (bgPrompt: string) => {
         if (!panoramaImage) return;
         runTask(async () => {
            const bgImageUrl = await generateImageFromText(bgPrompt);
            const blob = await fetch(bgImageUrl).then(r => r.blob());
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = (reader.result as string).split(',')[1];
                const bgImageData = { base64: base64data, mimeType: blob.type, name: `bg.png` };
                handleReplaceBg(bgImageData);
            };
         });
    }

    const handleReset = () => {
        setSourceImages([]);
        setPanoramaImage(null);
        setFinalImage(null);
        setPrompt('');
    };

    return (
        <div className="panorama-v2-root">
            <div ref={imageAreaRef} className="panorama-v2-stage">
                {isLoading && <div className="loading-overlay"><div className="spinner"></div><p>Procesando con IA...</p></div>}
                
                {stage === 'upload' && sourceImages.length === 0 && (
                    <div className="w-full h-full max-w-2xl">
                        <ImageUploader onImageUpload={(img) => handleFilesUpload([new File([],img.name, {type: img.mimeType})])} disabled={isLoading} />
                    </div>
                )}
                
                {stage === 'upload' && sourceImages.length > 0 && (
                     <div className="image-preview-grid">
                        {sourceImages.map(img => <img key={img.name} src={`data:${img.mimeType};base64,${img.base64}`} alt={img.name} />)}
                     </div>
                )}
                
                {stage !== 'upload' && finalImage && (
                    <div className="image-pan-container">
                       <img src={finalImage} alt="Panorama" />
                    </div>
                )}
            </div>
            
            <div className="panorama-v2-controls-bottom">
                {stage === 'upload' && (
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={handleReset} disabled={isLoading || sourceImages.length === 0} className="btn-noir-secondary"><ResetIcon/>Limpiar</button>
                        <button onClick={handleStitch} disabled={sourceImages.length < 2 || isLoading} className="btn-noir-primary"><WandIcon/>Unir Fotografías</button>
                    </div>
                )}
                
                {stage !== 'upload' && (
                    <div className="grid grid-cols-3 gap-4 items-start">
                        <div className="flex flex-col gap-2">
                           <h3 className="panel-section-title">Edición de Fondo</h3>
                           <button onClick={handleRemoveBg} disabled={isLoading} className="btn-noir-secondary">Quitar Fondo</button>
                           <button onClick={() => { setBackgroundUploaderVisible(true); setGalleryVisible(false); }} disabled={isLoading} className="btn-noir-secondary">Agregar Fondo</button>
                           <button onClick={() => { setGalleryVisible(true); setBackgroundUploaderVisible(false); }} disabled={isLoading} className="btn-noir-secondary">Galería de Fondos 8K</button>
                        </div>
                         
                        <div className="flex flex-col gap-2">
                            <h3 className="panel-section-title">Fondo Personalizado</h3>
                            {backgroundUploaderVisible && <ImageUploader onImageUpload={handleReplaceBg} disabled={isLoading} compact/>}
                            {galleryVisible && (
                                <div className="flex flex-col gap-2">
                                {BACKGROUND_GALLERY.map(bg => (
                                    <button key={bg.name} onClick={() => handleGenerateBgFromGallery(bg.prompt)} className="btn-noir-secondary text-sm">{bg.name}</button>
                                ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 text-right">
                             <button onClick={handleReset} disabled={isLoading} className="btn-noir-secondary self-end w-auto px-4"><ResetIcon/>Reiniciar</button>
                             <a href={finalImage!} download="panorama_editado.png" className="btn-noir-primary mt-auto"><DownloadIcon/>Descargar</a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PanoramaPro;