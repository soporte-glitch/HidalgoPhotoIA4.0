// Importa los módulos necesarios de la SDK de Google GenAI.
import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageData } from '../components/types';

/**
 * Función para editar una imagen basada en una descripción de texto.
 * Utiliza el modelo gemini-2.5-flash-image, optimizado para tareas de edición rápida de imágenes.
 * @param originalImage - El objeto de la imagen original.
 * @param prompt - La instrucción de texto que describe la edición.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen editada.
 */
export const editImageWithPrompt = async (originalImage: ImageData, prompt: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: originalImage.base64, mimeType: originalImage.mimeType } },
          { text: prompt },
        ],
      },
      config: { responseModalities: [Modality.IMAGE] },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No se generó ninguna imagen en la respuesta.");

  } catch (error) {
    console.error("Error al llamar a la API de Gemini para edición:", error);
    throw new Error("Fallo al editar la imagen desde la API.");
  }
};

/**
 * Función para generar una imagen desde cero a partir de un texto.
 * Utiliza el modelo gemini-2.5-pro para una capacidad de interpretación y calidad de imagen superior.
 * @param prompt - La instrucción de texto que describe la imagen a generar.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen generada.
 */
export const generateImageFromText = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001', // Se mantiene el modelo superior para generación de alta calidad.
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error('No se generó ninguna imagen en la respuesta.');
    } catch (error) {
        console.error('Error al llamar a la API de Gemini para generación:', error);
        throw new Error('Fallo al generar la imagen desde la API.');
    }
};
