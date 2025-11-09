import React, { useState, useMemo } from 'react';
import type { ImageData } from '../types';
import { createVirtualQuinceanera } from '../../services/geminiService';
import ImageUploader from '../ImageUploader';
import { WandIcon, DownloadIcon, ResetIcon } from '../Iconos';
import { useBusy } from '../../hooks/useBusy';
import ZoomPanImageContainer from '../common/ZoomPanImageContainer'; // Import the new component
import { showToast } from '../common/ToastNotification';


// --- ASSETS (Imágenes de muestra para la galería de XV Años) ---
const DRESS_STYLES_XV = [
    { name: 'Gala Nude', thumbnail: 'https://i.imgur.com/QhGvJk5.jpg', full: 'https://i.imgur.com/8xJgQ2G.png' },
    { name: 'Rosa Ensueño', thumbnail: 'https://i.imgur.com/5d7s7wB.jpg', full: 'https://i.imgur.com/5d7s7wB.jpg' },
    { name: 'Rojo Pasión', thumbnail: 'https://i.imgur.com/0dJz3yD.jpg', full: 'https://i.imgur.com/0dJz3yD.jpg' },
    { name: 'Azul Cielo', thumbnail: 'https://i.imgur.com/B7mYf2v.jpg', full: 'https://i.imgur.com/B7mYf2v.jpg' },
    { name: 'Negro Ébano', thumbnail: 'https://i.imgur.com/9i8k2wL.jpg', full: 'https://i.imgur.com/9i8k2wL.jpg' },
];

const BACKGROUND_STYLES = [
    { name: 'Salón Clásico', thumbnail: 'https://i.imgur.com/N29n14N.jpg', full: 'https://i.imgur.com/xOAbg0D.jpg' },
    { name: 'Jardín Mágico', thumbnail: 'https://i.imgur.com/jXk9gXl.jpg', full: 'https://i.imgur.com/jXk9gXl.jpg' },
    { name: 'Palacio Real', thumbnail: 'https://i.imgur.com/Tgj28i7.jpg', full: 'https://i.imgur.com/N29n14N.jpg' },
    { name: 'Urbano Chic', thumbnail: 'https://i.imgur.com/T0bA7Dl.jpg', full: 'https://i.imgur.com/T0bA7Dl.jpg' },
    { name: 'Hacienda', thumbnail: 'https://i.imgur.com/66nI5I1.jpeg', full: 'https://i.imgur.com/66nI5I1.jpeg' },
];

type Step = 'vestido' | 'peinado' | 'fondo' | 'ajustes';

// --- Helper para convertir URL a ImageData ---
const urlToImageData = async (url: string, name: string): Promise<ImageData> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({ base64, mimeType: blob.type, name });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode; }> = ({ isActive, onClick, children }) => (
    <button onClick={onClick} className={`tab-button ${isActive ? 'active' : ''}`}>{children}</button>
);

const GalleryItem: React.FC<{ name: string; thumbnail: string; isSelected: boolean; onClick: () => void; }> = ({ name, thumbnail, isSelected, onClick }) => (
    <div className={`gallery-item-nv ${isSelected ? 'selected' : ''}`} onClick={onClick} title={name}>
        <img src={thumbnail} alt={name} className="thumbnail" />
        <div className="label">{name}</div>
    </div>
);

const Slider: React.FC<{label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled: boolean}> = 
({label, value, onChange, disabled}) => (
  <div className="slider-control">
    <div className="label-row"><span className="label">{label}</span><span className="value">{value}%</span></div>
    <input type="range" min="0" max="200" value={value} onChange={onChange} disabled={disabled} />
  </div>
);


const XVVirtual: React.FC = () => {
    const [modelImage, setModelImage] = useState<ImageData | null>(null);
    const [dressImage, setDressImage] = useState<ImageData | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<ImageData | null>(null);
    const [selectedDress, setSelectedDress] = useState<string | null>(null);
    const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

    const [enhanceQuality, setEnhanceQuality] = useState(true);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const { isBusy: isLoading, error, start, fail, done } = useBusy();
    const [activeStep, setActiveStep] = useState<Step>('vestido');
    const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturate: 100 });

    const handleGenerate = async () => {
        if (!modelImage) return;
        setGeneratedImage(null);
        start();
        try {
            const result = await createVirtualQuinceanera({
                model: modelImage,
                dress: dressImage,
                background: backgroundImage,
                enhanceQuality: enhanceQuality,
            });
            if (result) {
                setGeneratedImage(result);
                showToast("Look de quinceañera virtual generado con éxito.", "success");
            }
            done();
        } catch(e: any) {
            fail(e.message || 'Error al crear el look virtual.');
            showToast(e.message || "Error al crear look de quinceañera.", "error");
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;
            ctx.drawImage(img, 0, 0);

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `xv_virtual_${modelImage?.name || 'generada'}.png`;
            link.click();
            showToast("Imagen de quinceañera virtual descargada.", "success");
        };
        img.src = generatedImage;
    };

    const handleReset = () => {
        setModelImage(null);
        setDressImage(null);
        setBackgroundImage(null);
        setSelectedDress(null);
        setSelectedBackground(null);
        setGeneratedImage(null);
        setFilters({ brightness: 100, contrast: 100, saturate: 100 });
    };

    const handleSelectDress = async (dress: typeof DRESS_STYLES_XV[0]) => {
        setSelectedDress(dress.name);
        const imageData = await urlToImageData(dress.full, dress.name);
        setDressImage(imageData);
    }
    const handleSelectBackground = async (bg: typeof BACKGROUND_STYLES[0]) => {
        setSelectedBackground(bg.name);
        const imageData = await urlToImageData(bg.full, bg.name);
        setBackgroundImage(imageData);
    }

    const imageStyle = useMemo(() => ({
        filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`,
        imageRendering: 'crisp-edges' as const,
    }), [filters]);

    return (
        <div className="h-full flex flex-col-reverse lg:flex-row gap-6 p-2">
            <div className="w-full lg:w-[450px] flex-shrink-0">
                <div className="avatar-box flex flex-col h-full">
                    <h2 className="header-logo" style={{textAlign: 'left', margin: '0 0 10px 0', fontSize: '22px'}}>Estudio XV Virtual</h2>
                    
                    <div className="mb-4">
                        <label className="panel-section-title">1. Rostro y Complexión Base</label>
                        <div className="h-40">
                            {modelImage ? (
                                <div className="relative group w-full h-full">
                                    <img src={`data:${modelImage.mimeType};base64,${modelImage.base64}`} alt="Modelo" className="w-full h-full object-cover rounded-lg"/>
                                    <button onClick={() => setModelImage(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                </div>
                            ) : (
                                <ImageUploader onImageUpload={setModelImage} disabled={isLoading} />
                            )}
                        </div>
                    </div>

                    <div className="controls-header">
                        <TabButton isActive={activeStep === 'vestido'} onClick={() => setActiveStep('vestido')}>Vestido</TabButton>
                        <TabButton isActive={activeStep === 'peinado'} onClick={() => setActiveStep('peinado')}>Peinado/Maquillaje</TabButton>
                        <TabButton isActive={activeStep === 'fondo'} onClick={() => setActiveStep('fondo')}>Fondo</TabButton>
                        <TabButton isActive={activeStep === 'ajustes'} onClick={() => setActiveStep('ajustes')}>Ajustes</TabButton>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 pt-4">
                        {activeStep === 'vestido' && (
                            <div>
                                <h3 className="panel-section-title">Galería de Vestidos</h3>
                                <div className="gallery-grid-nv">
                                    {DRESS_STYLES_XV.map(d => <GalleryItem key={d.name} name={d.name} thumbnail={d.thumbnail} isSelected={selectedDress === d.name} onClick={() => handleSelectDress(d)} />)}
                                </div>
                            </div>
                        )}
                        {activeStep === 'peinado' && (
                            <div className="text-center text-white/50 p-8">
                                <h3 className="font-semibold text-lg text-white/80">Próximamente</h3>
                                <p>Galerías de peinados y maquillajes.</p>
                            </div>
                        )}
                        {activeStep === 'fondo' && (
                             <div>
                                <h3 className="panel-section-title">Galería de Fondos</h3>
                                <div className="gallery-grid-nv">
                                    {BACKGROUND_STYLES.map(b => <GalleryItem key={b.name} name={b.name} thumbnail={b.thumbnail} isSelected={selectedBackground === b.name} onClick={() => handleSelectBackground(b)} />)}
                                </div>
                            </div>
                        )}
                        {activeStep === 'ajustes' && (
                            <div className="space-y-4">
                                <h3 className="panel-section-title">Filtros Finales</h3>
                                <Slider label="Brillo" value={filters.brightness} onChange={(e) => setFilters(f => ({...f, brightness: +e.target.value}))} disabled={isLoading || !generatedImage}/>
                                <Slider label="Contraste" value={filters.contrast} onChange={(e) => setFilters(f => ({...f, contrast: +e.target.value}))} disabled={isLoading || !generatedImage}/>
                                <Slider label="Saturación" value={filters.saturate} onChange={(e) => setFilters(f => ({...f, saturate: +e.target.value}))} disabled={isLoading || !generatedImage}/>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto space-y-3 pt-4 border-t border-plata">
                         <div className="checkbox-control"><input type="checkbox" id="enhance-xv" checked={enhanceQuality} onChange={e => setEnhanceQuality(e.target.checked)} /><label htmlFor="enhance-xv">Calidad Ultra (8K)</label></div>
                        <button onClick={handleGenerate} disabled={!modelImage || isLoading} className="btn-legendary w-full">
                            <WandIcon />
                            <span className="ml-2">{isLoading ? 'Creando Magia...' : 'Crear XV Virtual'}</span>
                        </button>
                        <div className="flex space-x-3">
                             <button onClick={handleReset} disabled={isLoading} className="btn-legendary"><ResetIcon /><span>Limpiar</span></button>
                            <button onClick={handleDownload} disabled={!generatedImage || isLoading} className="btn-legendary"><DownloadIcon /><span>Descargar</span></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-xl p-4 border border-white/10">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-oro"></div>
                        <p className="mt-4">Generando el retrato, por favor espera...</p>
                    </div>
                )}
                {!isLoading && error && (
                     <div className="text-center text-red-400 p-4"><h3 className="font-bold mb-2">Error</h3><p>{error}</p></div>
                )}
                {!isLoading && !error && generatedImage && (
                    <ZoomPanImageContainer>
                      <img src={generatedImage} alt="XV Virtual Generada" className="max-w-full max-h-full object-contain rounded-lg" style={imageStyle} />
                    </ZoomPanImageContainer>
                )}
                {!isLoading && !error && !generatedImage && (
                    <div className="text-center text-white/50 p-8">
                        <span className="text-6xl">👑✨</span>
                        <h2 className="text-2xl font-semibold mt-4 mb-2">Tu Quinceañera Virtual aparecerá aquí</h2>
                        <p>Sube una foto base y selecciona los elementos que desees combinar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default XVVirtual;