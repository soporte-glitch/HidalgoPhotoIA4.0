
import React from 'react';
import Placeholder from './Placeholder';

const IconUsers = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
);


const Recruitment: React.FC = () => {
  return (
    <Placeholder 
      title="Portal de Reclutamiento Próximamente"
      description="Publica vacantes para tu equipo de eventos, recibe postulaciones y gestiona candidatos. Nuestra IA te ayudará a filtrar los mejores perfiles."
      icon={<IconUsers />}
    />
  );
};

export default Recruitment;
