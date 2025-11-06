import React, { useState, useEffect } from 'react';
import { speak } from '../services/ttsService';

// Define el tipo del detalle del evento para mayor seguridad
interface NicoleSpeakEventDetail {
  text: string;
}

const NicoleVoiceEngine: React.FC = () => {
    // Mensaje de bienvenida inicial
    const [message, setMessage] = useState(
        "Bienvenido a OmniPhoto Studio Pro 4.8. Los módulos están cargados y el motor de IA está en línea. Estoy lista para asistirte."
    );

    useEffect(() => {
        // Habla el mensaje de bienvenida inicial solo una vez al montar el componente
        speak(message);

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
        <div className="nicole">
          <div className="nicole-head">
            <div className="avatar" id="nicoleAvatar"></div>
            <div>
              <div className="nicole-name">Nicole IA <span style={{color: 'var(--theme-accent-primary)'}}>Pro</span></div>
              <div className="nicole-role">Asistente Corporativa · OmniCorp IA</div>
            </div>
          </div>
          <div className="bubble" id="nicoleSay">
            {message}
          </div>
          <div className="footer">
            <div className="font-semibold">Autoría: HecJT & Kalel</div>
            <div>“Nosotros no creamos... transformamos.”</div>
          </div>
        </div>
    );
};

export default NicoleVoiceEngine;