
import React from 'react';
import { WandIcon, ResetIcon, DownloadIcon } from './Iconos';

interface EditorPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  onDownload: () => void;
  isLoading: boolean;
  canApply: boolean;
  canReset: boolean;
  canDownload: boolean;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  prompt,
  onPromptChange,
  onApply,
  onReset,
  onDownload,
  isLoading,
  canApply,
  canReset,
  canDownload,
}) => {
  return (
    <div className="bg-brand-primary p-6 rounded-xl shadow-lg flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-4">Panel de Edición IA</h2>
      
      <div className="flex-grow">
        <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">
          Describe la edición que deseas:
        </label>
        <textarea
          id="prompt"
          rows={4}
          className="w-full bg-brand-secondary border border-brand-secondary rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
          placeholder="Ej: 'cambia el fondo a una playa tropical', 'añade un birrete de graduación', 'haz que la foto parezca un cuadro al óleo'..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="mt-6 space-y-3">
        <button
          onClick={onApply}
          disabled={!canApply || isLoading}
          className="w-full flex items-center justify-center bg-gradient-to-br from-brand-secondary to-brand-highlight border border-brand-accent text-brand-text font-bold py-3 px-4 rounded-lg shadow-[0_0_10px_rgba(203,178,106,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:scale-105 hover:enabled:text-brand-accent-hover"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-brand-primary mr-2"></div>
              Aplicando Magia...
            </>
          ) : (
            <>
              <WandIcon />
              <span className="ml-2">Aplicar Edición</span>
            </>
          )}
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={onReset}
            disabled={!canReset || isLoading}
            className="w-full flex items-center justify-center bg-brand-secondary text-brand-text font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <ResetIcon />
            <span className="ml-2">Reiniciar</span>
          </button>
          <button
            onClick={onDownload}
            disabled={!canDownload || isLoading}
            className="w-full flex items-center justify-center bg-brand-secondary text-brand-text font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <DownloadIcon />
            <span className="ml-2">Descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;
