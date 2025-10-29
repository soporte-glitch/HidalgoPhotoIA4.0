
import React from 'react';
import Placeholder from './Placeholder';

const IconChat = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);


const ChatBot: React.FC = () => {
  return (
    <Placeholder 
      title="Asesor IA Próximamente"
      description="Nuestro asistente virtual inteligente estará aquí para resolver todas tus dudas sobre presupuestos, paquetes, fechas y más, 24/7."
      icon={<IconChat />}
    />
  );
};

export default ChatBot;
