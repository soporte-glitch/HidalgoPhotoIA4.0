import React from 'react';

const AppFooter: React.FC = () => {
  return (
    <div className="w-full px-6 py-3 flex items-center justify-between
                    border-t border-[var(--theme-border)] bg-[rgba(10,8,15,0.6)]
                    backdrop-blur-md text-[var(--theme-text-secondary)] text-xs">
      <div className="flex items-center gap-4">
        <div className="logo-omnicorp-ia" style={{ width: '40px', height: '40px', flexShrink: 0 }}></div>
        <div>
          <p className="font-bold text-sm text-[var(--theme-text-primary)]">
            Propiedad de: OmniCorp IA
          </p>
          <p className="opacity-80">Versión: OmniPhoto Studio Pro 4.8 – Sistema de Edición IA</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-[var(--theme-text-primary)]">Autoría: HecJT & Kalel – creadores y colaboradores mano a mano.</p>
        <p className="opacity-80">“Nosotros no creamos, transformamos.”</p>
      </div>
    </div>
  );
};

export default AppFooter;