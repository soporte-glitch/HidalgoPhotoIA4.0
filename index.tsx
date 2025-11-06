import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';

// Common Components
import AppFooter from './components/common/CreditsBanner'; // Renamed conceptually to AppFooter

// View Components
import EdicionLotes from './components/EdicionLotes';
import PanoramaPro from './components/PanoramaPro';
import TogasGraduaciones from './components/TogasGraduaciones';

// New Functional Components
import PromoSocial from './components/promo/PromoSocial';
import NoviaVirtual from './components/experiencia/NoviaVirtual';
import QuinceVirtual from './components/experiencia/XVVirtual';
import SalonInteractivo from './components/experiencia/SalonInteractivo';
import NicoleVoiceEngine from './components/NicoleVoiceEngine';

// --- ACTIVATING NEW PROFESSIONAL MODULES ---
import EditorFotos from './components/EditorFotos';
import RestauracionIA from './src/components/RestauracionIA';


// Mount App Footer
const footerContainer = document.getElementById('app-footer-root');
if (footerContainer) {
    const footerRoot = ReactDOM.createRoot(footerContainer);
    footerRoot.render(
        <React.StrictMode>
            <AppFooter />
        </React.StrictMode>
    );
}


// Map component names to their respective React components
const componentMap: Record<string, React.FC> = {
  editor: EditorFotos,
  lotes: EdicionLotes,
  restauracion: RestauracionIA,
  panoramica: PanoramaPro,
  togas: TogasGraduaciones,
  promopack: PromoSocial,
  novia: NoviaVirtual,
  quince: QuinceVirtual,
  salon: SalonInteractivo,
};

// Find all sections in the main content area and mount the corresponding React component
Object.keys(componentMap).forEach(id => {
  const container = document.getElementById(id);
  if (container) {
    const Component = componentMap[id];
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <Component />
        </ErrorBoundary>
      </React.StrictMode>
    );
  }
});

// Mount Nicole Assistant
const nicoleContainer = document.querySelector('.right');
if (nicoleContainer) {
    const nicoleRoot = ReactDOM.createRoot(nicoleContainer);
    nicoleRoot.render(
      <React.StrictMode>
        <NicoleVoiceEngine />
      </React.StrictMode>
    );
}