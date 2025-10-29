
import React from 'react';
import Placeholder from './Placeholder';

const IconMap = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent"><path d="M14.5 10.5c.6.6.6 1.5 0 2.1l-3 3c-.6.6-1.5.6-2.1 0l-4-4c-.6-.6-.6-1.5 0-2.1l7-7c.6-.6 1.5-.6 2.1 0l3 3c.6.6.6 1.5 0 2.1l-3 3z"></path><path d="m9.5 7.5 5 5"></path><path d="m14.5 17.5 5-5"></path></svg>
);

const TableMapper: React.FC = () => {
  return (
    <Placeholder 
      title="Mapping de Mesas Interactivo Próximamente"
      description="Diseña la distribución de tu salón arrastrando y soltando elementos. Asigna invitados a las mesas y comparte el plano digitalmente."
      icon={<IconMap />}
    />
  );
};

export default TableMapper;
