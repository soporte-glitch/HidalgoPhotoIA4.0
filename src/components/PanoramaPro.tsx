import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ImageData } from './types';
import { stitchPanorama, removeBackground, replaceBackground } from '../services/geminiService';
import { WandIcon, DownloadIcon, ResetIcon, UploadIcon } from './Iconos';
import { useBusy } from '../hooks/useBusy';
import '../styles/OmnicorpLegendaryTheme.css';
import ZoomPanImageContainer from './common/ZoomPanImageContainer'; // Import the new component
import { showToast } from './common/ToastNotification';


// Helper to convert a remote image URL to base64 data.
// This can fail due to CORS policy on the image server. Adding a comment about it.
const urlToImageData = async (url: string, name: string): Promise<ImageData> => {
    // Note: Fetching directly from URLs like imgur may be blocked by CORS policy.
    // A CORS proxy might be needed for this to work reliably in a browser environment.
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error al cargar la imagen del fondo: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            if (base64) {
                resolve({ base64, mimeType: blob.type, name });
            } else {
                reject(new Error("No se pudo leer el archivo de imagen de fondo."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};


// Helper to convert a local file to ImageData, with resizing for performance.
const fileToImageData = (file: File): Promise<ImageData | null> => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const MAX_DIMENSION = 1920;
                let { width, height } = img;
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    if (width > height) {
                        height = Math.round((height / width) * MAX_DIMENSION);
                        width = MAX_DIMENSION;
                    } else {
                        width = Math.round((width / height) * MAX_DIMENSION);
                        height = MAX_DIMENSION;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const quality = mimeType === 'image/jpeg' ? 0.92 : undefined;
                const dataUrl = canvas.toDataURL(mimeType, quality);
                const base64 = dataUrl.split(',')[1];

                if (base64) {
                    resolve({ base64, mimeType, name: file.name });
                } else {
                    console.warn(`No se pudo procesar el archivo: ${file.name}`);
                    resolve(null);
                }
            };
            img.src = e.target?.result as string;
        };
        reader.onerror = error => {
            console.error(`Error al leer el archivo ${file.name}:`, error);
            resolve(null);
        };
        reader.readAsDataURL(file);
    });
};

const BACKGROUND_GALLERY = [
    { name: 'Playa Tropical', url: 'https://i.imgur.com/kSIT2oW.jpeg' },
    { name: 'Ciudad Nocturna', url: 'https://i.imgur.com/p1y7GkM.jpeg' },
    { name: 'Bosque Encantado', url: 'https://i.imgur.com/66nI5I1.jpeg' },
];

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

const PanoramaPro: React.FC = () => {
    const [sourceImages, setSourceImages] = useState<ImageData[]>([]);
    const [stitchedImage, setStitchedImage] = useState<ImageData | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const { isBusy: isLoading, error, runTask } = useBusy();
    const [prompt, setPrompt] = useState('');
    const [galleryVisible, setGalleryVisible] = useState(false);

    // Apply full-viewport mode on mount
    useEffect(() => {
        const wrapElement = document.querySelector('.wrap');
        wrapElement?.classList.add('view-mode-full');
        return () => wrapElement?.classList.remove('view-mode-full');
    }, []);

    const stage = useMemo<'upload' | 'stitched' | 'edited'>(() => {
        if (!stitchedImage) return 'upload';
        const stitchedImageUrl = `data:${stitchedImage.mimeType};base64,${stitchedImage.base64}`;
        if (!editedImage || editedImage === stitchedImageUrl) return 'stitched';
        return 'edited';
    }, [stitchedImage, editedImage]);

    const handleReset = useCallback(() => {
        setSourceImages([]);
        setStitchedImage(null);
        setEditedImage(null);
        setPrompt('');
        setGalleryVisible(false);
    }, []);

    const handleFilesUpload = useCallback((files: File[]) => {
        handleReset();
        runTask(async () => {
            const imagePromises = files.map(fileToImageData);
            const results = await Promise.all(imagePromises);
            const validImages = results.filter((img): img is ImageData => img !== null);
            setSourceImages(validImages);
            showToast(`Se subieron ${validImages.length} imágenes.`, "success");
        });
    }, [handleReset, runTask]);

    const handleStitch = useCallback(() => {
        if (sourceImages.length < 2) {
            showToast("Necesitas al menos 2 imágenes para unir.", "error");
            return;
        }
        runTask(async () => {
            try {
                const resultUrl = await stitchPanorama(sourceImages, prompt, true);
                const mimeType = resultUrl.substring(resultUrl.indexOf(':') + 1, resultUrl.indexOf(';'));
                const base64 = resultUrl.split(',')[1];
                
                const newStitchedImage = { base64, mimeType, name: 'panorama_unido.png' };
                setStitchedImage(newStitchedImage);
                setEditedImage(resultUrl);
                showToast("Panorámica unida con éxito.", "success");
            } catch (e: any) {
                showToast(e.message || "Error al unir la panorámica.", "error");
                throw e;
            }
        });
    }, [sourceImages, prompt, runTask]);

    const handleRemoveBg = useCallback(() => {
        if (!stitchedImage) return;
        runTask(async () => {
            try {
                const result = await removeBackground(stitchedImage);
                setEditedImage(result);
                showToast("Fondo removido con éxito.", "success");
            } catch (e: any) {
                showToast(e.message || "Error al remover el fondo.", "error");
                throw e;
            }
        });
    }, [stitchedImage, runTask]);

    const handleReplaceBg = useCallback(async (bg: typeof BACKGROUND_GALLERY[0]) => {
        if (!stitchedImage) return;
        runTask(async () => {
            try {
                const bgImageData = await urlToImageData(bg.url, bg.name);
                const result = await replaceBackground(stitchedImage, bgImageData);
                setEditedImage(result);
                showToast("Fondo reemplazado con éxito.", "success");
            } catch (e: any) {
                showToast(e.message || "Error al reemplazar el fondo.", "error");
                throw e;
            }
        });
    }, [stitchedImage, runTask]);

    const handleDownload = useCallback(() => {
        if (!editedImage) return;
        const link = document.createElement('a');
        link.href = editedImage;
        link.download = `panorama_editado.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Panorámica descargada.", "success");
    }, [editedImage]);

    const renderWorkspace = () => {
        if (isLoading) {
             return (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Procesando con IA...</p>
                </div>
             );
        }
        if (stage === 'upload') {
            return sourceImages.length > 0
                ? (
                    <div className="flex flex-wrap gap-2 justify-center items-center p-4">
                        {sourceImages.map((img, index) => (
                            <img key={index} src={`data:${img.mimeType};base64,${img.base64}`} alt={`Fuente ${index + 1}`} className="max-h-24 rounded-md shadow-lg" />
                        ))}
                    </div>
                )
                : <MultiImageUploader onFilesUpload={handleFilesUpload} disabled={isLoading} />;
        }
        if (editedImage) {
            return (
                <ZoomPanImageContainer>
                    <img src={editedImage} alt="Resultado Final" className="w-full h-full object-contain" />
                </ZoomPanImageContainer>
            );
        }
        return null;
    };
    
    return (
        <div className="editor-root">
            <div className="editor-workspace">
                <div className="image-area relative">
                    {renderWorkspace()}
                </div>
                <div className="tools-panel avatar-box">
                    <div className="panel-header">
                        <h2 className="header-logo" style={{textAlign: 'left', margin: 0, fontSize: '24px'}}>Panorama Pro IA</h2>
                        <p>Une múltiples imágenes o edita una panorámica existente con IA.</p>
                    </div>

                    {stage === 'upload' && (
                        <div className="panel-section">
                            <label className="panel-section-title">Instrucciones de Unión (Opcional)</label>
                            <textarea
                                className="prompt-area"
                                placeholder="Ej: 'une las fotos creando una vista de atardecer, ajusta los colores para que sean más cálidos'..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleStitch}
                                disabled={sourceImages.length < 2 || isLoading}
                                className="btn-legendary w-full mt-2"
                            >
                                <WandIcon /> Unir {sourceImages.length} Imágenes
                            </button>
                        </div>
                    )}

                    {stage !== 'upload' && (
                        <div className="panel-section">
                            <label className="panel-section-title">Edición Adicional</label>
                            <div className="flex flex-col gap-2">
                                <button onClick={handleRemoveBg} disabled={isLoading} className="btn-legendary">Quitar Fondo</button>
                                <button onClick={() => setGalleryVisible(!galleryVisible)} disabled={isLoading} className="btn-legendary">Reemplazar Fondo</button>
                            </div>
                            {galleryVisible && (
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                    {BACKGROUND_GALLERY.map(bg => (
                                        <div key={bg.name} className="cursor-pointer group" onClick={() => handleReplaceBg(bg)}>
                                            <img
                                                src={bg.url}
                                                alt={bg.name}
                                                className="w-full h-16 object-cover rounded border-2 border-transparent group-hover:border-oro transition-all"
                                            />
                                            <p className="text-xs text-center mt-1">{bg.name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
                    
                    <div className="panel-footer button-group">
                        <button onClick={handleReset} disabled={isLoading} className="btn-legendary">
                            <ResetIcon /> Reiniciar
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={!editedImage || isLoading}
                            className="btn-legendary"
                        >
                            <DownloadIcon /> Descargar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanoramaPro;