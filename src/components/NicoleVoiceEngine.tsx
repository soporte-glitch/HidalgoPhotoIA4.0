import React, { useState, useEffect } from 'react';
import { speak } from '../services/ttsService';

// Define el tipo del detalle del evento para mayor seguridad
interface NicoleSpeakEventDetail {
  text: string;
}

const NicoleVoiceEngine: React.FC = () => {
    // Mensaje de bienvenida inicial
    const [message, setMessage] = useState(
        "Bienvenido a CinemaMagic IA Studio. Los módulos están cargados y el motor de IA está en línea. Estoy lista para asistirte."
    );

    useEffect(() => {
        // ELIMINADO: speak(message);
        // Esta línea causaba una voz de bienvenida que se solapaba con el
        // mensaje del módulo inicial disparado por `show()` en index.html.
        // La primera verbalización ahora es manejada exclusivamente por el evento.

        // Función para manejar el evento personalizado
        const handleSpeak = (event: CustomEvent<NicoleSpeakEventDetail>) => {
            const { text } = event.detail;
            if (text) {
                setMessage(text);
                speak(text); // Verbaliza el nuevo mensaje
            }
        };

        // Suscribe el componente al evento
        document.addEventListener('nicole-speak', handleSpeak as EventListener);

        // Limpia el listener cuando el componente se desmonta
        return () => {
            document.removeEventListener('nicole-speak', handleSpeak as EventListener);
        };
    }, []); // El array vacío asegura que el efecto se ejecute solo una vez

    return (
        <div className="avatar-box">
          <div className="nicole-head flex items-center gap-3">
            <div 
              className="avatar w-14 h-14 rounded-lg bg-cover bg-center border-2 border-vino" 
              id="nicoleAvatar"
              style={{backgroundImage: "url('https://i.imgur.com/H6GjK0u.png')"}}
            ></div>
            <div>
              <div className="nicole-name text-lg font-bold">Nicole IA <span style={{color: 'var(--color-oro)'}}>Pro</span></div>
              <div className="nicole-role text-xs" style={{color: 'var(--color-oro)'}}>Asistente Corporativa · OmniCorp IA</div>
            </div>
          </div>
          <div className="quote-box mt-4 flex-grow" id="nicoleSay" style={{textAlign: 'left'}}>
            {message}
          </div>
          <div className="footer-sello" style={{opacity: 1, color: 'var(--color-plata)'}}>
             “Nosotros no creamos... transformamos.”
          </div>
        </div>
    );
};

export default NicoleVoiceEngine;