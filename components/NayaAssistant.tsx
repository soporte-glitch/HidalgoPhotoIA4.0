
import React from 'react';
import Placeholder from './Placeholder';

const IconVoice = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    </svg>
);

const NayaAssistant: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
        <Placeholder
          title="Asistente Naya"
          description="Soy Naya, tu asistente de voz avanzada. Próximamente estaré aquí para ayudarte a navegar la suite, gestionar tus proyectos y responder a tus comandos de voz en tiempo real."
          icon={<IconVoice />}
        />
    </div>
  );
};

export default NayaAssistant;