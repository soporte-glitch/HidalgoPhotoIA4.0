import React, { useState, useEffect, useCallback, useRef } from 'react';
import { startNayaSession } from '../services/nayaVoice';

// Define the shape of the session object we expect from nayaVoice
interface NayaSession {
  close: () => void;
  sendText: (text: string) => void;
}

const NayaAssistant: React.FC = () => {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [nayaState, setNayaState] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [transcriptionText, setTranscriptionText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('Activa tu micrófono para hablar con NAYA.');
  const [inputText, setInputText] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  const nayaSessionRef = useRef<NayaSession | null>(null);
  const transcriptionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
      setPermissionState(permissionStatus.state);
      permissionStatus.onchange = () => setPermissionState(permissionStatus.state);
    });
     // Cleanup on unmount
    return () => {
        nayaSessionRef.current?.close();
    }
  }, []);

  const handleTranscriptionUpdate = useCallback((text: string, isFinal: boolean) => {
    setTranscriptionText(text);
    if (isFinal && text.trim() !== '') {
      if (transcriptionTimeoutRef.current) clearTimeout(transcriptionTimeoutRef.current);
      transcriptionTimeoutRef.current = window.setTimeout(() => setTranscriptionText(''), 5000);
    } else if (transcriptionTimeoutRef.current) {
      clearTimeout(transcriptionTimeoutRef.current);
    }
  }, []);

  const handleStateChange = useCallback((state: 'idle' | 'connecting' | 'active' | 'error') => {
    setNayaState(state);
    switch(state) {
        case 'idle': setStatusMessage('Activa el micrófono o escribe para hablar con NAYA.'); break;
        case 'connecting': setStatusMessage('Conectando con los servidores de NAYA...'); break;
        case 'active': setStatusMessage('NAYA está escuchando...'); break;
        case 'error': setStatusMessage('Hubo un error en la conexión. Inténtalo de nuevo.'); break;
    }
  }, []);

  const handleError = useCallback((error: string) => {
    handleStateChange('error');
    setStatusMessage(error);
  }, [handleStateChange]);

  const connectToNaya = useCallback(async () => {
    if (nayaState !== 'idle' || permissionState === 'denied') return;
    try {
      const session = await startNayaSession({
        onTranscriptionUpdate: handleTranscriptionUpdate,
        onStateChange: handleStateChange,
        onError: handleError,
      });
      nayaSessionRef.current = session;
      return session;
    } catch (e) {
      if (e instanceof Error && e.message === "Permission denied") {
         setPermissionState('denied');
         handleError('Activa tu micrófono para hablar con NAYA.');
      } else {
         handleError('No se pudo iniciar la sesión con NAYA.');
      }
      return null;
    }
  }, [nayaState, permissionState, handleTranscriptionUpdate, handleStateChange, handleError]);
  
  const disconnectFromNaya = () => {
    nayaSessionRef.current?.close();
    nayaSessionRef.current = null;
  };
  
  const handleSendText = async () => {
    if (!inputText.trim() || nayaState === 'connecting') return;
    
    let currentSession = nayaSessionRef.current;
    if (!currentSession) {
        currentSession = await connectToNaya();
    }

    if (currentSession) {
        // Wait a brief moment if we just connected to ensure readiness
        setTimeout(() => {
            currentSession?.sendText(inputText.trim());
            setInputText('');
        }, nayaSessionRef.current ? 0 : 500);
    }
  };

  const renderContent = () => {
    const showTextInput = permissionState === 'denied' || nayaState === 'idle' || nayaState === 'active' || nayaState === 'error';
    
    return (
      <>
        <div className="flex-grow flex flex-col items-center justify-center w-full relative my-4">
            {avatarError ? (
                <div className="w-48 h-48 md:w-56 md:h-56 mb-6 rounded-full bg-black/30 border-2 border-[#D6AC62] shadow-lg shadow-[#D6AC62]/10 flex items-center justify-center animate-breathing">
                    <span className="font-serif text-7xl text-[#D6AC62] opacity-80 select-none">NA</span>
                </div>
            ) : (
                <div className="relative w-48 h-48 md:w-56 md:h-56 mb-6">
                     <img
                        src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAuMBoADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1VWV1hZWmNkZWZnaGlqc3R1dnd4eXqDlIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A8/ooor6A+TCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACii"
                        onError={() => setAvatarError(true)}
                        className={`w-full h-full object-cover rounded-full shadow-lg shadow-[#D6AC62]/20 transition-all duration-500 ${nayaState === 'active' ? 'animate-breathing scale-105' : 'scale-100'}`}
                    />
                    <div className={`absolute inset-0 rounded-full border-4 transition-all duration-300 ${nayaState === 'active' ? 'border-[#D6AC62]' : 'border-transparent'}`}></div>
                </div>
            )}
            <div className="text-center">
                <p className="font-bold text-lg text-white/95">{nayaState === 'active' ? 'Escuchando...' : 'NAYA'}</p>
                <p className="text-gray-400 h-10 transition-opacity duration-300">{transcriptionText || statusMessage}</p>
            </div>
        </div>

        {showTextInput && (
            <div className="w-full max-w-lg mx-auto flex items-center gap-2">
                {nayaState !== 'active' && (
                    <button onClick={connectToNaya} disabled={permissionState === 'denied' || nayaState === 'connecting'} className="p-3 bg-[#D6AC62] rounded-full text-[#3A0820] hover:bg-[#e7c04e] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
                    </button>
                )}
                 {nayaState === 'active' && (
                    <button onClick={disconnectFromNaya} className="p-3 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                    </button>
                )}
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
                    placeholder="O escribe tu pregunta aquí..."
                    className="flex-grow p-3 bg-black/30 border border-[#D6AC62]/30 rounded-full text-gray-200 focus:ring-2 focus:ring-[#D6AC62] focus:border-transparent transition-colors"
                    disabled={nayaState === 'connecting'}
                />
                <button onClick={handleSendText} disabled={!inputText.trim() || nayaState === 'connecting'} className="p-3 bg-[#D6AC62] rounded-full text-[#3A0820] hover:bg-[#e7c04e] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        )}
      </>
    );
  };

  // FIX: Added main component structure and return statement.
  return (
    <div className="container mx-auto max-w-3xl pt-16 md:pt-0 animate-fade-in h-full flex flex-col">
        <header className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif">
                Asistente <span className="text-brand-accent">NAYA</span>
            </h1>
            <p className="text-brand-text-secondary mt-2 font-sans">
                Tu asistente personal de voz. Haz preguntas, pide ideas y gestiona tu evento conversando.
            </p>
        </header>
        <main className="flex-grow flex flex-col items-center justify-center p-4">
            {renderContent()}
        </main>
    </div>
  );
};

// FIX: Added default export.
export default NayaAssistant;
