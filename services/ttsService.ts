import { GoogleGenAI, Modality } from "@google/genai";

// --- Funciones de Decodificación de Audio ---
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000); // 1 canal, 24000 sample rate
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

// --- Contexto de Audio Global y Control de Reproducción ---
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null; // Para controlar la reproducción

const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContext({ sampleRate: 24000 });
  }
  return audioContext;
};

/**
 * Convierte texto a voz usando la API de Gemini y lo reproduce.
 * Detiene cualquier audio que se esté reproduciendo antes de iniciar uno nuevo.
 * @param text El texto a convertir en voz.
 */
export const speak = async (text: string): Promise<void> => {
  if (!process.env.API_KEY) {
    console.error("API_KEY no configurada para el servicio TTS.");
    return;
  }
  if (!text) return;

  // Detiene la reproducción de audio actual si existe
  if (currentSource) {
    currentSource.stop();
    currentSource = null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Una voz femenina clara
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const ctx = getAudioContext();
      const decodedBytes = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(decodedBytes, ctx);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      
      currentSource = source;
      source.onended = () => {
        if (currentSource === source) {
          currentSource = null;
        }
      };
    }
  } catch (error) {
    console.error("Error en el servicio de Text-to-Speech:", error);
  }
};