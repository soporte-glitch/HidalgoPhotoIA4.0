
import React from 'react';

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title, description, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-brand-text p-8">
      <div className="mb-6">{icon}</div>
      <h2 className="text-3xl font-bold mb-3 text-white">{title}</h2>
      <p className="max-w-md text-brand-text-secondary">{description}</p>
    </div>
  );
};

export default Placeholder;
