
import React from 'react';
import Placeholder from './Placeholder';

const IconSparkles = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent">
      <path d="M12 3L9.5 8.5 4 11l5.5 2.5L12 19l2.5-5.5L20 11l-5.5-2.5z"></path>
    </svg>
);

const AtuendoIA: React.FC = () => {
  return (
    <Placeholder 
      title="Estudio Creativo con IA"
      description="Bienvenido al Estudio Creativo. Sube una foto y nuestra IA te permitirá probarte virtualmente diferentes atuendos y estilos para cualquier ocasión. Próximamente."
      icon={<IconSparkles />}
    />
  );
};

export default AtuendoIA;