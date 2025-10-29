import React from 'react';
import type { ImageData } from './types';
import { WandIcon, ResetIcon, DownloadIcon } from './Iconos';

interface ManualAdjustments {
  brightness: number;
  contrast: number;
  saturate: number;
  sharpness: number;
}

interface EditorPanelProps {
  originalImage: ImageData | null;
  editedImage: string | null;
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  onRestore: () => void;
  onDownload: () => void;
  isLoading: boolean;
  adjustments: ManualAdjustments;
  setAdjustments: (adjustments: ManualAdjustments) => void;
}

const AdjustmentSlider: React.FC<{label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled: boolean}> = ({ label, value, onChange, disabled }) => (
  <div>
    <label className="text-xs font-medium text-gray-300 flex justify-between items-center">
      <span>{label}</span>
      <span>{value}</span>
    </label>
    <input
      type="range"
      min="0"
      max="200"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full h-2 bg-brand-primary/50 rounded-lg appearance-none cursor-pointer accent-[#D6AC62] disabled:opacity-50"
    />
  </div>
);

const EditorPanel: React.FC<EditorPanelProps> = ({ originalImage, editedImage, prompt, setPrompt, onGenerate, onRestore, onDownload, isLoading, adjustments, setAdjustments }) => {
  const hasImage = originalImage !== null;
  const hasEditedImage = editedImage !== null;

  const handleAdjustmentChange = (field: keyof ManualAdjustments) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdjustments({ ...adjustments, [field]: parseInt(e.target.value, 10) });
  };
  
  const specialEditButtons = [
    { label: "Suavizado de Piel", prompt: "Aplica un suavizado de piel profesional y natural al sujeto principal, conservando la textura." },
    { label: "Fondo Artístico", prompt: "Reemplaza el fondo con un fondo artístico y desenfocado (bokeh) que complemente al sujeto principal." },
    { label: "Añadir Nitidez", prompt: "Aumenta la nitidez y el detalle de la imagen de forma realista." },
    { label: "Filtro Retro", prompt: "Aplica un filtro de estilo retro o vintage a la imagen, con colores desvanecidos y un ligero grano." },
  ];

  return (
    <div className="bg-[#3A0820] border border-white/10 p-6 rounded-xl shadow-2xl h-full flex flex-col">
      <h3 className="text-xl font-bold text-white/95 mb-4">Panel de Edición IA</h3>
      
      <div className="flex-grow flex flex-col gap-4 overflow-y-auto pr-2">
        <label className="font-medium text-gray-300 text-sm">Edición por Texto</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: Haz que el cielo sea más dramático."
          className="w-full h-24 p-3 bg-black/30 border border-[#D6AC62]/30 rounded-lg text-gray-200 focus:ring-2 focus:ring-[#D6AC62] focus:border-transparent transition-colors"
          disabled={!hasImage || isLoading}
        />
        <button
          onClick={onGenerate}
          disabled={!hasImage || isLoading || !prompt.trim()}
          className="w-full bg-[#D6AC62] text-[#3A0820] font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:bg-[#e7c04e] hover:shadow-xl hover:shadow-[#D6AC62]/20 active:scale-95 disabled:bg-gray-500 disabled:text-gray-800 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generando...
            </>
          ) : (
            <>
              <WandIcon />
              Generar Edición
            </>
          )}
        </button>
        
        <div className="mt-4 border-t border-white/10 pt-4">
            <label className="font-medium text-gray-300 text-sm">Ideas de Edición (Clic para usar)</label>
             <div className="grid grid-cols-2 gap-2 mt-2">
                {specialEditButtons.map(btn => (
                     <button key={btn.label} onClick={() => setPrompt(btn.prompt)} disabled={!hasImage || isLoading} className="p-2 text-xs bg-transparent border border-[#D6AC62]/60 rounded-lg text-[#D6AC62] hover:bg-[#D6AC62] hover:text-[#3A0820] hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95">
                         {btn.label}
                     </button>
                ))}
             </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
          <label className="font-medium text-gray-300 text-sm">Ajustes Manuales (Vista Previa)</label>
          <AdjustmentSlider label="Brillo" value={adjustments.brightness} onChange={handleAdjustmentChange('brightness')} disabled={!hasImage} />
          <AdjustmentSlider label="Contraste" value={adjustments.contrast} onChange={handleAdjustmentChange('contrast')} disabled={!hasImage} />
          <AdjustmentSlider label="Saturación" value={adjustments.saturate} onChange={handleAdjustmentChange('saturate')} disabled={!hasImage} />
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4 flex flex-col gap-2">
         <button 
            onClick={onDownload}
            disabled={!hasEditedImage || isLoading}
            className="w-full bg-[#D6AC62] text-[#3A0820] font-bold py-2 px-4 rounded-lg hover:bg-[#e7c04e] hover:shadow-xl hover:shadow-[#D6AC62]/20 active:scale-95 transition-all duration-200 disabled:bg-gray-500 disabled:text-gray-800 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          <DownloadIcon />
          Descargar Imagen Mejorada
        </button>
        <button 
            onClick={onRestore}
            disabled={!hasImage || isLoading}
            className="w-full bg-transparent border border-gray-500 text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-700 hover:text-white active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          <ResetIcon />
          Restaurar Original
        </button>
      </div>
    </div>
  );
};

export default EditorPanel;