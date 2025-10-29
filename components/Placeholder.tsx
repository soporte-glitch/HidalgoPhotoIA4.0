
import React from 'react';

interface PlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title, description, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center pt-16 md:pt-0">
      <div className="p-6 bg-brand-secondary rounded-full mb-6">
        {icon}
      </div>
      <h2 className="text-3xl font-bold text-brand-text mb-2">{title}</h2>
      <p className="text-brand-text-secondary max-w-md">{description}</p>
    </div>
  );
};

export default Placeholder;
