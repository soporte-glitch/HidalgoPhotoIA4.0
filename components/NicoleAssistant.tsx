import React, { useState, useEffect } from 'react';
import { speak } from '../services/ttsService';
import { restorePhoto } from '../services/geminiService';
import type { ImageData } from './types';
import BeforeAfterSlider from './BeforeAfterSlider';

const NicoleAssistant: React.FC = () => {
  const [statusText, setStatusText] = useState("Sube una imagen para restaurarla a su máxima calidad.");
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const greetNicole = async () => {
      try {
        await speak("Hola, soy Nicole, tu asistente de OmniCorp IA. Estoy lista para restaurar tus imágenes con precisión.");
      } catch (err) {
        console.warn("Error al iniciar la voz de Nicole:", err);
      }
    };
    greetNicole();
  }, []);

  const handleFileChange = (file: File | null) => {
    if (!file || !file.type.startsWith('image/') || isLoading) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      if (base64) {
        const imageData = { base64, mimeType: file.type, name: file.name };
        setOriginalImage(imageData);
        setRestoredImage(null);
        setError(null);
        setIsLoading(true);

        setStatusText("Analizando y restaurando la imagen a calidad ultra...");
        speak("Iniciando proceso de restauración a máxima calidad. Esto podría tardar un momento.");

        try {
          // Llama a restorePhoto con enhanceQuality: true por defecto para Nicole
          const result = await restorePhoto(imageData, true);
          setRestoredImage(result);
          const successMessage = "La restauración ha sido completada con éxito. Tu imagen ya está lista.";
          setStatusText(successMessage);
          speak(successMessage);
        } catch (err: any) {
          const message = err.message || "Ocurrió un error durante la restauración.";
          setError(message);
          setStatusText(message);
          speak("Se ha producido un error. Por favor, inténtalo de nuevo.");
          setOriginalImage(null); // Reset on error
        } finally {
          setIsLoading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleReset = () => {
      setOriginalImage(null);
      setRestoredImage(null);
      setError(null);
      setStatusText("Lista para un nuevo trabajo. Sube otra imagen.");
      speak("Lista para un nuevo trabajo.");
  }

  const originalImageUrl = originalImage ? `data:${originalImage.mimeType};base64,${originalImage.base64}` : null;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="w-full max-w-2xl bg-brand-primary p-6 rounded-2xl shadow-2xl border border-brand-secondary">
        <div className="flex flex-col items-center text-center">
            
          <div
            className="w-40 h-40 rounded-full mb-4 bg-cover bg-center transition-all duration-500 border-4 border-brand-secondary shadow-lg"
            style={{
            backgroundImage: "url('https://i.imgur.com/gf6326.jpeg')",
              boxShadow: isLoading
                ? "0 0 25px rgba(255, 215, 0, 0.8)"
                : "0 0 20px rgba(255, 255, 255, 0.3)",
            }}
          ></div>
          
          <h1 className="text-3xl font-bold text-brand-accent font-display mb-2">
            Nicole IA Pro
          </h1>
           <p className={`text-sm mb-4 max-w-md h-10 flex items-center justify-center transition-colors duration-300 ${
              error ? 'text-red-500' : 'text-brand-text-secondary'
            }`}>
            {statusText}
          </p>

          {restoredImage && originalImageUrl ? (
            <div className="w-full mt-4 flex flex-col items-center gap-4">
                <BeforeAfterSlider beforeImage={originalImageUrl} afterImage={restoredImage} />
                <button
                    onClick={handleReset}
                    className="bg-brand-accent text-brand-primary font-bold py-2 px-6 rounded-lg hover:bg-brand-accent-hover transition-colors"
                >
                    Restaurar otra imagen
                </button>
            </div>
          ) : (
            <>
              <label
                htmlFor="nicole-upload"
                className={`cursor-pointer bg-brand-accent px-6 py-3 rounded-lg text-brand-primary font-semibold hover:bg-brand-accent-hover transition-all duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Procesando...' : 'Seleccionar Imagen'}
              </label>
              <input
                id="nicole-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isLoading}
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NicoleAssistant;