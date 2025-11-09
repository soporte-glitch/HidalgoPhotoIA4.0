

import React from 'react';
import Placeholder from './Placeholder';

const IconMegaphone = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent">
        <path d="m3 11 18-5v12L3 14v-3z"></path>
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
    </svg>
);

const SocialMediaManager: React.FC = () => {
  return (
    <Placeholder
      title="Social Media Manager IA Próximamente"
      description="Automatiza y optimiza tus publicaciones en redes sociales. Nuestra IA analizará tendencias, sugerirá el mejor contenido y programará tus posts para alcanzar la máxima audiencia."
      icon={<IconMegaphone />}
    />
  );
};

export default SocialMediaManager;