

import React, { useState } from 'react';
// Fix: Use the correct exported function name from geminiService.
import { generateImageFromText } from '../services/geminiService';

const stylePresets = ["Boho Chic", "Glamour Nocturno", "Lujo Clásico", "Fiesta de Graduación", "Minimalista Moderno", "Tropical"];

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Un elegante salón de eventos para una boda, con decoración floral y luces cálidas.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Por favor, ingresa una descripción para la imagen.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setImageUrl('');

    try {
      const fullPrompt = `Genera un render fotorrealista de: ${prompt}. Alta definición, iluminación cinematográfica.`;
      // Fix: Use the correct function to generate an image from text.
      const generatedImageUrl = await generateImageFromText(fullPrompt);
      setImageUrl(generatedImageUrl);
    } catch (err) {
      setError('Hubo un error al generar la imagen. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    const newPrompt = `Un salón de eventos con estilo ${preset}, con mesas decoradas y ambiente festivo.`;
    setPrompt(newPrompt);
  };
  
  return (
    <div className="container mx-auto max-w-4xl pt-16 md:pt-0">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-brand-text">Generador de Ambientes con IA</h2>
        <p className="text-brand-text-secondary mt-2">Visualiza el evento de tus sueños. Describe tu idea o elige un estilo.</p>
      </div>

      <div className="bg-brand-secondary p-6 rounded-xl shadow-2xl">
        <div className="flex flex-col gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Un salón para 15 años con temática de galaxia..."
            className="w-full h-24 p-3 bg-brand-primary border border-gray-600 rounded-lg text-brand-text focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition-colors"
            disabled={isLoading}
          />
          <div className="flex flex-wrap gap-2">
            {stylePresets.map(preset => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-gray-700 text-brand-text-secondary rounded-full hover:bg-brand-accent hover:text-brand-primary transition-colors disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
          <button
            onClick={handleGenerateImage}
            disabled={isLoading}
            className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-brand-accent-hover transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando...
              </>
            ) : (
              '✨ Generar Imagen'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}
      
      <div className="mt-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center bg-brand-secondary rounded-xl p-8 aspect-video">
              <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-accent"></div>
              <p className="text-brand-text-secondary mt-4">Creando tu visión, un pixel a la vez...</p>
          </div>
        )}
        {imageUrl && !isLoading && (
          <div className="bg-brand-secondary p-2 rounded-xl shadow-lg">
            <img src={imageUrl} alt="Generated event" className="rounded-lg w-full h-auto object-cover" />
          </div>
        )}
         {!imageUrl && !isLoading && (
          <div className="flex flex-col items-center justify-center bg-brand-secondary rounded-xl p-8 aspect-video border-2 border-dashed border-gray-600">
              <IconImage />
              <p className="text-brand-text-secondary mt-4">La imagen generada aparecerá aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const IconImage = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);


export default ImageGenerator;