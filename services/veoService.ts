import { GoogleGenAI } from "@google/genai";

export interface VideoGenerationConfig {
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    resolution: '720p' | '1080p';
}

export interface VideoGenerationStatus {
    status: 'pending' | 'generating' | 'polling' | 'done' | 'error';
    message: string;
    progress?: number;
}

/**
 * Generates a video using the VEO model from a text prompt.
 * @param config - The configuration for the video generation.
 * @param onStatusUpdate - A callback function to report progress.
 * @returns A promise that resolves with the Blob URL of the generated video.
 */
export const generateVideo = async (
    config: VideoGenerationConfig,
    onStatusUpdate: (status: VideoGenerationStatus) => void
): Promise<string> => {
    onStatusUpdate({ status: 'generating', message: 'Inicializando motor de video...' });
    
    // VEO models require a new instance to ensure the latest API key is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        onStatusUpdate({ status: 'generating', message: 'Enviando solicitud a los servidores de VEO...' });
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: config.prompt,
            config: {
                numberOfVideos: 1,
                resolution: config.resolution,
                aspectRatio: config.aspectRatio,
            }
        });

        onStatusUpdate({ status: 'polling', message: 'Operación iniciada. Esperando renderización... (Esto puede tardar varios minutos)' });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            onStatusUpdate({ status: 'polling', message: 'Comprobando estado del video... Por favor, mantén esta ventana abierta.' });
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
            throw new Error(`Error en la operación de video: ${operation.error.message}`);
        }

        onStatusUpdate({ status: 'done', message: '¡Video generado! Descargando archivo...' });

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('No se encontró el enlace de descarga del video en la respuesta.');
        }

        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Error al descargar el video: ${videoResponse.statusText}`);
        }
        
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        onStatusUpdate({ status: 'done', message: 'Video listo para visualizar.' });
        return videoUrl;

    } catch (error) {
        console.error("Error en la generación de video con VEO:", error);
        
        if (error instanceof Error && error.message.includes("Requested entity was not found.")) {
             throw new Error("API_KEY_INVALID");
        }
        
        throw new Error("Ocurrió un error inesperado durante la generación del video. Revisa la consola para más detalles.");
    }
};