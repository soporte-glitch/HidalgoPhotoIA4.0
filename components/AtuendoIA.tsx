import React from 'react';
import Placeholder from './Placeholder';

const IconAtuendoIA = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><path d="M6.3 21.7C5.5 21 5 20 5 19v-2.7c0-.5.2-1 .6-1.4L11 9l-2.5-2.5c-.8-.8-2-1.3-3.2-1.3H4"/><path d="M17.7 21.7c.8-.7 1.3-1.7 1.3-2.7v-2.7c0-.5-.2-1-.6-1.4L13 9l2.5-2.5c.8-.8 2-1.3 3.2-1.3H20"/></svg>;

const AtuendoIA: React.FC = () => {
  return (
    <Placeholder 
      title="Atuendo IA Próximamente"
      description="Sube una foto y recibe recomendaciones de vestuario, prueba virtualmente diferentes estilos y encuentra el look perfecto para tu evento, todo generado por IA."
      icon={<IconAtuendoIA />}
    />
  );
};

export default AtuendoIA;
