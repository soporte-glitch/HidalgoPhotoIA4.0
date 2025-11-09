import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { LayoutItem } from '../../services/layoutPlanner';
import { useBusy } from '../../hooks/useBusy';
import { generateLayoutFromPrompt, generateImageFromText, generateLayoutFromImageAndPrompt, generateRealisticVenueView, correctDictatedText } from '../../services/geminiService';
import type { ImageData } from '../types';
import ImageUploader from '../ImageUploader';
import { MicIcon, MicOffIcon, WandIcon } from '../Iconos';
import { showToast } from '../common/ToastNotification';


// Extend the window interface to include our custom navigation function
declare global {
  interface Window {
    show: (id: string) => void;
  }
}

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

const TOOLBAR_ITEMS = [
  { type: 'round-table', label: 'Mesa Redonda', icon: '⚪' },
  { type: 'rect-table', label: 'Mesa Rect.', icon: '▭' },
  { type: 'dance-floor', label: 'Pista', icon: '🕺' },
  { type: 'stage', label: 'Templete', icon: '🎤' },
];

const ITEM_DIMS = {
  'round-table': { width: 48, height: 48, color: 'rgba(230, 230, 230, 0.95)' },
  'rect-table': { width: 24, height: 72, color: 'rgba(230, 230, 230, 0.95)' },
  'dance-floor': { width: 120, height: 120, color: 'rgba(255, 216, 77, 0.85)' },
  'stage': { width: 144, height: 72, color: 'rgba(122, 0, 31, 0.9)' },
};

const SalonInteractivo: React.FC = () => {
  const [items, setItems] = useState<LayoutItem[]>([]
    /* Uncomment to test with initial items:
    , [
      { id: 'dance-floor-1', type: 'dance-floor', x: 340, y: 340, width: 120, height: 120 },
      { id: 'round-table-1', type: 'round-table', x: 100, y: 100, width: 48, height: 48 },
      { id: 'round-table-2', type: 'round-table', x: 200, y: 100, width: 48, height: 48 },
    ]*/
  );
  const [salonSize] = useState({ width: 800, height: 600 });
  const [layoutPrompt, setLayoutPrompt] = useState('Salón para 100 personas con pista de baile central y templete al fondo');
  const [ambiencePrompt, setAmbiencePrompt] = useState('Boda de lujo en un jardín de noche con luces de hadas');
  const [ambienceUrl, setAmbienceUrl] = useState<string | null>(null);
  const [realVenueImage, setRealVenueImage] = useState<ImageData | null>(null);
  const [venueDimensions, setVenueDimensions] = useState('20m x 30m');
  const [realisticPreviewUrl, setRealisticPreviewUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [draggingItem, setDraggingItem] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const { isBusy: isLoading, error, start, fail, done, clearError } = useBusy();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isCanvasDragging = useRef(false);
  const lastCanvasMousePosition = useRef<{ x: number; y: number } | null>(null);


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            setLayoutPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error('Error en reconocimiento de voz:', event.error);
            setIsListening(false);
        };
        recognitionRef.current = recognition;
    }
    return () => recognitionRef.current?.abort();
  }, []);

  const toggleListen = () => {
      if (isListening) {
          recognitionRef.current?.stop();
      } else {
          recognitionRef.current?.start();
          setIsListening(true);
      }
  };
  
  const handleCorrectText = async () => {
      if (!layoutPrompt) return;
      start();
      try {
          const corrected = await correctDictatedText(layoutPrompt);
          if (corrected) {
            setLayoutPrompt(corrected);
            showToast("Texto corregido con IA.", "success");
          }
          done();
      } catch (e: any) {
          fail(e.message || 'Error al corregir texto.');
          showToast(e.message || "Error al corregir texto.", "error");
      }
  };

  const handleGenerateLayout = async () => {
      clearError();
      start();
      try {
          let result;
          if (realVenueImage) {
              result = await generateLayoutFromImageAndPrompt(realVenueImage, layoutPrompt, venueDimensions, salonSize.width, salonSize.height);
              showToast("Plano generado desde imagen con éxito.", "success");
          } else {
              result = await generateLayoutFromPrompt(layoutPrompt, salonSize.width, salonSize.height);
              showToast("Plano generado con éxito.", "success");
          }
          if (result) {
              setItems(result);
          }
          done();
      } catch (e: any) {
          fail(e.message || 'Error al generar el plano.');
          showToast(e.message || "Error al generar plano.", "error");
      }
  };

  const handleGenerateAmbience = async () => {
      clearError();
      start();
      try {
          const result = await generateImageFromText(`Crea un fondo de un salón de eventos con la siguiente temática: ${ambiencePrompt}. La imagen debe ser una vista superior (cenital) y atmosférica, adecuada como fondo para un plano de distribución.`);
          if (result) {
              setAmbienceUrl(result);
              setRealVenueImage(null); // Desactiva la imagen real si se genera un ambiente
              showToast("Ambiente generado con éxito.", "success");
          }
          done();
      } catch (e: any) {
          fail(e.message || 'Error al generar ambiente.');
          showToast(e.message || "Error al generar ambiente.", "error");
      }
  }

  const handleGenerateRealisticView = async () => {
    if (!realVenueImage || items.length === 0) {
        showToast("Necesitas una imagen de salón real y un plano para generar la vista realista.", "error");
        return;
    }
    clearError();
    start();
    try {
        const result = await generateRealisticVenueView(realVenueImage, items, ambiencePrompt);
        if (result) {
            setRealisticPreviewUrl(result);
            showToast("Vista realista renderizada con éxito.", "success");
        }
        done();
    } catch(e: any) {
        fail(e.message || 'Error al renderizar la vista.');
        showToast(e.message || "Error al renderizar vista realista.", "error");
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply canvas transformations for zoom and pan
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    // Solo dibujar la cuadrícula si no hay una imagen de fondo (real o generada)
    if (!realVenueImage && !ambienceUrl) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.5 / zoom; // Scale line width with zoom
      for (let x = 0; x < canvas.width; x += 24) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 24) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    }

    items.forEach(item => {
      ctx.fillStyle = ITEM_DIMS[item.type as keyof typeof ITEM_DIMS]?.color || 'gray';
      ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
      ctx.lineWidth = 2 / zoom; // Scale line width with zoom

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10 / zoom; // Scale shadow blur with zoom
      ctx.shadowOffsetX = 2 / zoom;
      ctx.shadowOffsetY = 4 / zoom;

      if (item.type === 'round-table') {
        ctx.beginPath();
        ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(item.x, item.y, item.width, item.height);
        ctx.strokeRect(item.x, item.y, item.width, item.height);
      }
      ctx.shadowColor = 'transparent'; // Reset shadow
    });

    ctx.restore(); // Restore context to prevent transformations affecting subsequent draws
  }, [items, realVenueImage, ambienceUrl, zoom, panX, panY]);

    useEffect(() => {
        draw();
    }, [draw]);

    const addItem = (type: LayoutItem['type']) => {
        const newItem: LayoutItem = {
            id: `${type}-${Date.now()}`,
            type,
            ...ITEM_DIMS[type],
            x: 20 / zoom - panX, // Adjust new item position based on current view
            y: 20 / zoom - panY,
        };
        setItems(prev => [...prev, newItem]);
        showToast(`Elemento '${TOOLBAR_ITEMS.find(t => t.type === type)?.label}' añadido.`, "success");
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - panX) / zoom;
        const mouseY = (e.clientY - rect.top - panY) / zoom;

        for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            if (mouseX >= item.x && mouseX <= item.x + item.width &&
                mouseY >= item.y && mouseY <= item.y + item.height) {
                setDraggingItem({ id: item.id, offsetX: mouseX - item.x, offsetY: mouseY - item.y });
                return;
            }
        }
        isCanvasDragging.current = true;
        lastCanvasMousePosition.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (draggingItem) {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - panX) / zoom;
            const mouseY = (e.clientY - rect.top - panY) / zoom;

            setItems(prevItems => prevItems.map(item =>
                item.id === draggingItem.id
                    ? { ...item, x: mouseX - draggingItem.offsetX, y: mouseY - draggingItem.offsetY }
                    : item
            ));
        } else if (isCanvasDragging.current && lastCanvasMousePosition.current) {
            const dx = e.clientX - lastCanvasMousePosition.current.x;
            const dy = e.clientY - lastCanvasMousePosition.current.y;
            setPanX(prev => prev + dx);
            setPanY(prev => prev + dy);
            lastCanvasMousePosition.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleCanvasMouseUp = () => {
      setDraggingItem(null);
      isCanvasDragging.current = false;
      lastCanvasMousePosition.current = null;
    };

    const handleWheel = useCallback((e: WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleAmount = 1.1;
      const newZoom = Math.max(0.5, Math.min(zoom * (e.deltaY < 0 ? scaleAmount : 1 / scaleAmount), 3)); // Max 300% zoom

      const newPanX = mouseX - ((mouseX - panX) * (newZoom / zoom));
      const newPanY = mouseY - ((mouseY - panY) * (newZoom / zoom));

      setZoom(newZoom);
      setPanX(newPanX);
      setPanY(newPanY);
    }, [zoom, panX, panY]);

    const handleDoubleClick = useCallback(() => {
      setZoom(1);
      setPanX(0);
      setPanY(0);
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('dblclick', handleDoubleClick);
        return () => {
          canvas.removeEventListener('wheel', handleWheel);
          canvas.removeEventListener('dblclick', handleDoubleClick);
        };
      }
    }, [handleWheel, handleDoubleClick]);

    return (
        <div className="h-full flex flex-col-reverse lg:flex-row gap-6 p-2">
            {/* Panel Izquierdo: Controles */}
            <div className="bg-panel p-4 rounded-xl shadow-neon-gold border border-white/10 flex flex-col h-full w-full lg:w-[420px]">
                <h2 className="text-xl font-bold text-white mb-4 text-hover" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                    Diseñador de Salón IA
                </h2>

                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div>
                        <h3 className="text-md font-semibold text-brand-neon mb-2">1. Describe tu Evento</h3>
                        <div className="relative">
                          <textarea rows={3} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 pr-12 text-white focus:ring-2 focus:ring-brand-neon transition"
                              placeholder="Ej: Boda para 150 invitados, pista blanca al centro, 16 mesas redondas con manteles verdes y 3 arreglos florales colgando..."
                              value={layoutPrompt} onChange={(e) => setLayoutPrompt(e.target.value)} disabled={isLoading} />
                           <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                              <button onClick={toggleListen} disabled={isLoading || !recognitionRef.current} className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white/70 hover:bg-white/20'}`} title={isListening ? 'Detener dictado' : 'Dictar por voz'}>
                                  {isListening ? <MicOffIcon /> : <MicIcon />}
                              </button>
                              <button onClick={handleCorrectText} disabled={isLoading || isListening || !layoutPrompt} className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors disabled:opacity-50" title="Corregir texto con IA">
                                  <WandIcon />
                              </button>
                          </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-semibold text-brand-neon mb-2">2. Usa tu Salón Real (Opcional)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <ImageUploader onImageUpload={setRealVenueImage} disabled={isLoading} compact/>
                            <div className="space-y-2">
                                <label htmlFor="venue-dims" className="text-xs text-white/70">Dimensiones (ej. 20m x 30m)</label>
                                <input id="venue-dims" type="text" className="dimension-input" value={venueDimensions} onChange={e => setVenueDimensions(e.target.value)} disabled={isLoading}/>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={handleGenerateLayout} disabled={isLoading || !layoutPrompt} className="w-full text-sm bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50">
                        {isLoading ? 'Generando Plano...' : 'Generar Plano sobre Salón'}
                    </button>

                    <div>
                        <h3 className="text-md font-semibold text-brand-neon mb-2">3. Herramientas Manuales</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {TOOLBAR_ITEMS.map(tool => (
                                <button key={tool.type} onClick={() => addItem(tool.type as LayoutItem['type'])} className="bg-black/20 hover:bg-black/40 text-white/80 text-sm p-2 rounded-lg flex items-center justify-center gap-2 transition" disabled={isLoading}>
                                    <span>{tool.icon}</span>{tool.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10 space-y-3">
                    {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
                     <button onClick={handleGenerateRealisticView} disabled={isLoading || !realVenueImage || items.length === 0} className="w-full text-sm bg-gradient-to-r from-brand-neon-pink to-brand-neon text-black font-bold py-3 px-4 rounded-lg shadow-lg transition-all disabled:opacity-50">
                        {isLoading ? 'Renderizando...' : '✨ Generar Vista Realista 8K'}
                    </button>
                </div>
            </div>

            {/* Panel Central: Lienzo */}
            <div className="flex-1 bg-black/20 rounded-xl p-2 border border-white/10 flex items-center justify-center min-h-[400px] lg:min-h-0 relative"
                 style={{
                    backgroundImage: realVenueImage ? `url(data:${realVenueImage.mimeType};base64,${realVenueImage.base64})` : ambienceUrl ? `url(${ambienceUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                 }}
            >
                {isLoading && !realisticPreviewUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-panel/80 rounded-xl z-10">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-neon"></div>
                        <p className="text-white/80 mt-4">Procesando...</p>
                    </div>
                )}
                <canvas ref={canvasRef} width={salonSize.width} height={salonSize.height}
                    className="relative max-w-full max-h-full object-contain"
                    onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} />
            </div>

            {/* Modal para Vista Realista */}
            {realisticPreviewUrl && (
                <div className="preview-modal-backdrop" onClick={() => setRealisticPreviewUrl(null)}>
                    <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
                        {isLoading ? (
                             <div className="w-full h-full flex flex-col items-center justify-center">
                                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-neon"></div>
                                <p className="text-white/80 mt-4">Renderizando vista final...</p>
                             </div>
                        ) : (
                            <>
                                <img src={realisticPreviewUrl} alt="Vista Realista del Salón" />
                                <button onClick={() => setRealisticPreviewUrl(null)} className="preview-modal-close-btn">&times;</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalonInteractivo;