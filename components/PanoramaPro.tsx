import React from 'react';
import Placeholder from './Placeholder';

const IconPanoramaPro = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent"><path d="M2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2 2 6.48 2 12z"/><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><path d="M12 12v10"/></svg>;

const PanoramaPro: React.FC = () => {
  return (
    <Placeholder 
      title="Panorama Pro Próximamente"
      description="Crea impresionantes vistas panorámicas de 360° a partir de una sola foto. Nuestra IA expandirá la imagen, generando un entorno inmersivo con un realismo increíble, procesado eficientemente con Web Workers."
      icon={<IconPanoramaPro />}
    />
  );
};

export default PanoramaPro;
