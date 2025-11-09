import React from 'react';
import Placeholder from './Placeholder';

const IconProjector = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent">
        <path d="M5 7 3 5"/><path d="M9 6V3"/><path d="m13 7 2-2"/><path d="M17 6V3"/><path d="M21 7l-2-2"/><path d="M4 11a1 1 0 0 1-1-1 1 1 0 0 1 1-1"/><path d="M12 11a1 1 0 0 1-1-1 1 1 0 0 1 1-1"/><path d="M20 11a1 1 0 0 1-1-1 1 1 0 0 1 1-1"/><path d="M4 17h.01"/><path d="M12 17h.01"/><path d="M20 17h.01"/><rect width="18" height="10" x="3" y="9" rx="2"/>
    </svg>
);

const VideoMappingPro: React.FC = () => {
  return (
    <Placeholder
      title="Video Mapping Pro Próximamente"
      description="Proyecta visuales espectaculares sobre cualquier superficie. Sube una foto de tu escenario y nuestra IA generará un show de video mapping a la medida."
      icon={<IconProjector />}
    />
  );
};

export default VideoMappingPro;
