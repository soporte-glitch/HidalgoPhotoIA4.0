import React, { useState, useCallback } from 'react';
import type { ImageData } from './types';
import { useBusy } from '../hooks/useBusy';
import { editImageWithPrompt } from '../services/geminiService';
import { WandIcon, DownloadIcon, UploadIcon, ResetIcon } from './Iconos';

interface BatchImage {
  id: string;
  original: ImageData;
  processedUrl: string | null;
  status: 'pendiente' | 'procesando' | 'completado' | 'error';
  error?: string;
}

const MultiImageUploader: React.FC<{ onFilesUpload: (files: File[]) => void; disabled: boolean }> = ({ onFilesUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = React.useId();

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      onFilesUpload(Array.from(files));
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled) handleFileChange(e.dataTransfer.files);
  }, [disabled, onFilesUpload]);

  return (
    <div
      onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragEnter} onDrop={onDrop}
      className={`relative flex flex-col items-center justify-center w-full h-full min-h-48 border-2 border-dashed rounded-lg transition-colors duration-300 ${isDragging ? 'border-oro' : 'border-plata'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <input type="file" id={inputId} className="hidden" accept="image/*" multiple onChange={(e) => handleFileChange(e.target.files)} disabled={disabled} />
      <label htmlFor={inputId} className={`flex flex-col items-center justify-center w-full h-full p-4 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <div className="w-12 h-12 text-oro"><UploadIcon /></div>
        <p className="mt-2">Arrastra tus imágenes aquí</p>
        <p className="text-sm">o haz clic para seleccionar</p>
      </label>
    </div>
  );
};

const MAX_DIMENSION = 1920;

const EdicionLotes: React.FC = () => {
    const [images, setImages] = useState<BatchImage[]>([]);
    const [prompt, setPrompt] = useState('');
    const [prefix, setPrefix] = useState('OmniPhoto-');
    const { isBusy: isLoading, error, start, fail, done } = useBusy();
    const [progress, setProgress] = useState(0);

    const handleFilesUpload = useCallback((files: File[]) => {
      const newImagesPromises: Promise<BatchImage>[] = files
        .filter(file => file.type.startsWith('image/'))
        .map(file => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              let { width, height } = img;
              if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                  height = (height / width) * MAX_DIMENSION;
                  width = MAX_DIMENSION;
                } else {
                  width = (width / height) * MAX_DIMENSION;
                  height = MAX_DIMENSION;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
    
              const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
              const quality = mimeType === 'image/jpeg' ? 0.9 : undefined;
              const dataUrl = canvas.toDataURL(mimeType, quality);
              const base64 = dataUrl.split(',')[1];
              
              resolve({
                id: `${file.name}-${Date.now()}`,
                original: { base64, mimeType, name: file.name },
                processedUrl: null,
                status: 'pendiente',
              });
            };
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
        }));
      
      Promise.all(newImagesPromises).then(imageData => {
        setImages(prev => [...prev, ...imageData]);
      });
    }, []);

    const handleProcessBatch = async () => {
        if (!prompt || images.length === 0) return;
        start();
        
        try {
            let processedCount = 0;
            setProgress(0);
            setImages(currentImages => currentImages.map(img => ({...img, status: 'pendiente', processedUrl: null, error: undefined})));

            const imagesToProcess = [...images];

            for (let i = 0; i < imagesToProcess.length; i++) {
                const image = imagesToProcess[i];
                setImages(currentImages => currentImages.map(img => img.id === image.id ? { ...img, status: 'procesando' } : img));
                try {
                    const resultUrl = await editImageWithPrompt(image.original, prompt);
                    setImages(currentImages => currentImages.map(img => img.id === image.id ? { ...img, status: 'completado', processedUrl: resultUrl } : img));
                } catch (e: any) {
                    setImages(currentImages => currentImages.map(img => img.id === image.id ? { ...img, status: 'error', error: e.message } : img));
                }
                processedCount++;
                setProgress((processedCount / imagesToProcess.length) * 100);
            }
            done();
        } catch (e: any) {
            fail("Ocurrió un error general durante el procesamiento por lotes.");
        }
    };

    const handleDownloadAll = () => {
        const completedImages = images.filter(img => img.status === 'completado' && img.processedUrl);
        if (completedImages.length === 0) return;
    
        completedImages.forEach((img, index) => {
            const link = document.createElement('a');
            link.href = img.processedUrl!;
            link.download = `${prefix}${index + 1}_${img.original.name}`;
            setTimeout(() => {
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, 150 * index);
        });
    };

    const handleReset = () => {
        setImages([]);
        setPrompt('');
        setPrefix('OmniPhoto-');
        setProgress(0);
    }

    const completedCount = images.filter(img => img.status === 'completado').length;

    return (
        <div className="h-full flex flex-col lg:flex-row gap-6 p-2">
            <div className="w-full lg:w-96 flex-shrink-0">
                <div className="avatar-box flex flex-col h-full">
                    <h2 className="text-xl font-bold mb-4 header-logo" style={{textAlign: 'left', margin: 0}}>Edición por Lotes IA</h2>
                    <div className="mb-4">
                        <MultiImageUploader onFilesUpload={handleFilesUpload} disabled={isLoading} />
                    </div>
                    <div>
                        <label htmlFor="batch-prompt" className="panel-section-title">Comando IA para aplicar en masa</label>
                        <textarea
                            id="batch-prompt"
                            rows={4}
                            className="prompt-area"
                            placeholder="Ej: 'mejora la luz y el contraste', 'aplica un filtro blanco y negro dramático'..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="mt-auto pt-4 border-t border-plata space-y-3">
                         <div className="w-full bg-black/20 rounded-full h-2.5">
                            <div className="bg-oro h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease' }}></div>
                        </div>
                        <button onClick={handleProcessBatch} disabled={images.length === 0 || !prompt || isLoading} className="btn-legendary w-full">
                            <WandIcon /> <span>{isLoading ? `Procesando... (${Math.round(progress)}%)` : `Procesar ${images.length} Imágenes`}</span>
                        </button>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={prefix} 
                                onChange={e => setPrefix(e.target.value)} 
                                placeholder="Prefijo..." 
                                disabled={isLoading}
                                className="prompt-area flex-grow"
                                style={{minHeight: 'auto', padding: '10px'}}
                            />
                            <button onClick={handleDownloadAll} disabled={isLoading || completedCount === 0} className="btn-legendary">
                                <DownloadIcon /> <span>Descargar</span>
                            </button>
                            <button onClick={handleReset} disabled={isLoading} className="btn-legendary">
                                <ResetIcon />
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-xs text-center pt-2">{error}</p>}
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col bg-black/20 rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 text-center">Resultados del Lote ({completedCount}/{images.length})</h3>
                {images.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-center text-white/50">
                        <p>Sube imágenes y define un comando para comenzar.</p>
                    </div>
                )}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2">
                    {images.map(img => (
                        <div key={img.id} className="bg-panel p-2 rounded-lg border border-white/10 flex flex-col">
                            <div className="aspect-square relative flex items-center justify-center">
                                {img.status === 'completado' && <img src={img.processedUrl!} alt="Procesada" className="w-full h-full object-contain rounded" />}
                                {img.status !== 'completado' && <img src={`data:${img.original.mimeType};base64,${img.original.base64}`} alt="Original" className={`w-full h-full object-contain rounded ${img.status === 'procesando' ? 'opacity-30' : ''}`} />}
                                {img.status === 'procesando' && <div className="absolute w-8 h-8 border-2 border-dashed rounded-full animate-spin border-oro"></div>}
                            </div>
                            <div className="text-xs text-white/70 truncate mt-2" title={img.original.name}>{img.original.name}</div>
                            <div className="flex items-center justify-between mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${img.status === 'completado' ? 'bg-green-500/20 text-green-300' : img.status === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/50'}`}>
                                    {img.status}
                                </span>
                                {img.status === 'completado' && (
                                    <a href={img.processedUrl!} download={`editado_${img.original.name}`} className="p-1 hover:bg-white/20 rounded-full"><DownloadIcon /></a>
                                )}
                            </div>
                             {img.status === 'error' && <p className="text-xs text-red-400 mt-1" title={img.error}>{img.error}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EdicionLotes;