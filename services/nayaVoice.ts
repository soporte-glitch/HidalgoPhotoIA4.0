import { GoogleGenAI, Modality, LiveServerMessage, Blob } from "@google/genai";

// Audio utility functions (encoding/decoding)
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
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
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Session management variables
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let stream: MediaStream | null = null;
let scriptProcessor: ScriptProcessorNode | null = null;
let sources = new Set<AudioBufferSourceNode>();
let nextStartTime = 0;

interface NayaCallbacks {
    onTranscriptionUpdate: (text: string, isFinal: boolean) => void;
    onStateChange: (state: 'idle' | 'connecting' | 'active' | 'error') => void;
    onError: (error: string) => void;
}

const closeActiveSession = (callbacks?: NayaCallbacks) => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    if (scriptProcessor) {
        scriptProcessor.disconnect();
        scriptProcessor = null;
    }
    if (inputAudioContext && inputAudioContext.state !== 'closed') {
        inputAudioContext.close();
        inputAudioContext = null;
    }
    if (outputAudioContext && outputAudioContext.state !== 'closed') {
        outputAudioContext.close();
        outputAudioContext = null;
    }
    for (const source of sources.values()) {
        try { source.stop(); } catch (e) { console.warn("Error stopping audio source", e); }
    }
    sources.clear();
    nextStartTime = 0;
    if (callbacks) callbacks.onStateChange('idle');
};

export const startNayaSession = async (callbacks: NayaCallbacks) => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    
    closeActiveSession(); // Close any pre-existing session
    
    callbacks.onStateChange('connecting');

    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
        console.error("Error al obtener acceso al micrófono:", err);
        callbacks.onError("No se pudo acceder al micrófono. Por favor, revisa los permisos en tu navegador.");
        throw new Error("Permission denied");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Fix: Handle vendor-prefixed AudioContext for older browsers to prevent TypeScript errors.
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    inputAudioContext = new AudioContext({ sampleRate: 16000 });
    outputAudioContext = new AudioContext({ sampleRate: 24000 });
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    let currentOutputTranscription = '';

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                if (!inputAudioContext || !stream) return;
                callbacks.onStateChange('active');
                
                const source = inputAudioContext.createMediaStreamSource(stream);
                scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                
                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromise.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };

                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.outputTranscription) {
                    const text = message.serverContent.outputTranscription.text;
                    currentOutputTranscription += text;
                    callbacks.onTranscriptionUpdate(currentOutputTranscription, false);
                }
                
                if (message.serverContent?.turnComplete) {
                    callbacks.onTranscriptionUpdate(currentOutputTranscription, true);
                    currentOutputTranscription = '';
                }

                const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                if (base64EncodedAudioString && outputAudioContext) {
                    nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContext, 24000, 1);
                    const sourceNode = outputAudioContext.createBufferSource();
                    sourceNode.buffer = audioBuffer;
                    sourceNode.connect(outputNode);
                    sourceNode.addEventListener('ended', () => { sources.delete(sourceNode); });
                    sourceNode.start(nextStartTime);
                    nextStartTime = nextStartTime + audioBuffer.duration;
                    sources.add(sourceNode);
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error("NAYA Session Error:", e);
                callbacks.onError("Se perdió la conexión con NAYA.");
                closeActiveSession(callbacks);
            },
            onclose: (e: CloseEvent) => {
                console.log("NAYA Session Closed.", e);
                if (e.code !== 1000) { // 1000 is normal closure
                    callbacks.onError("La sesión se cerró inesperadamente.");
                }
                closeActiveSession(callbacks);
            },
        },
        config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
        },
    });

    const session = await sessionPromise;

    return {
        close: () => {
            try {
                session.close();
            } catch(e) {
                console.error("Error closing session", e);
            } finally {
                closeActiveSession(callbacks);
            }
        },
        sendText: (text: string) => {
            if (text) {
                session.sendRealtimeInput({ text });
            }
        }
    };
};