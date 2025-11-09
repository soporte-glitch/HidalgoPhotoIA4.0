import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';

// Common Components
import CreditsBanner from './components/common/CreditsBanner'; // Renamed import
import ZoomPanImageContainer from './components/common/ZoomPanImageContainer'; // New import for reusable zoom/pan logic
import ToastNotification from './components/common/ToastNotification'; // New import for toast notification system

// View Components
import EdicionLotes from './components/EdicionLotes';
import PanoramaPro from './components/PanoramaPro';
import TogasGraduaciones from './components/TogasGraduaciones';
import PromoSocial from './components/promo/PromoSocial';
import NoviaVirtual from './components/experiencia/NoviaVirtual';
import QuinceVirtual from './components/experiencia/XVVirtual';
import SalonInteractivo from './components/experiencia/SalonInteractivo';
import NicoleVoiceEngine from './components/NicoleVoiceEngine';
import EditorFotos from './components/EditorFotos';
// Fix: Corrected import path for RestauracionIA to maintain a consistent component structure.
import RestauracionIA from './components/RestauracionIA';
import VideoExperience from './components/VideoExperience';
import VideoMappingPro from './components/VideoMappingPro';
import SintetizadorConceptual from './components/experiencia/SintetizadorConceptual';


// --- Toast Notification System ---
interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handleShowToast = (event: CustomEvent) => {
            const { message, type } = event.detail;
            const newToast: ToastMessage = {
                id: Date.now(),
                message,
                type,
            };
            setToasts(currentToasts => [...currentToasts, newToast]);
            setTimeout(() => {
                setToasts(currentToasts => currentToasts.filter(t => t.id !== newToast.id));
            }, 3000);
        };

        document.addEventListener('show-toast', handleShowToast as EventListener);
        return () => document.removeEventListener('show-toast', handleShowToast as EventListener);
    }, []);

    return (
        <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {toasts.map(toast => (
                <div key={toast.id} className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            ))}
        </div>
    );
};

// Map component names to their respective React components
const componentMap: Record<string, React.FC> = {
  editor: EditorFotos,
  lotes: EdicionLotes,
  restauracion: RestauracionIA,
  panoramica: PanoramaPro,
  videoexperience: VideoExperience,
  videomapping: VideoMappingPro,
  togas: TogasGraduaciones,
  promopack: PromoSocial,
  novia: NoviaVirtual,
  quince: QuinceVirtual,
  salon: SalonInteractivo,
  sintetizador: SintetizadorConceptual,
};

// Store render roots to manage unmounting/cleanup
const rootMap: Map<string, ReactDOM.Root> = new Map();

// Mount Toast Container
const toastContainer = document.getElementById('toast-root');
if (toastContainer) {
    ReactDOM.createRoot(toastContainer).render(<ToastContainer />);
}

// Mount App Footer
const footerContainer = document.getElementById('app-footer-root');
if (footerContainer) {
    ReactDOM.createRoot(footerContainer).render(<CreditsBanner />);
}

// Mount view components and Nicole Assistant
const mountComponents = () => {
  Object.keys(componentMap).forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      if (!rootMap.has(id)) {
        rootMap.set(id, ReactDOM.createRoot(container));
      }
      const Component = componentMap[id];
      rootMap.get(id)?.render(<ErrorBoundary><Component /></ErrorBoundary>);
    }
  });

  // Mount Nicole Assistant in the .right sidebar
  const nicoleContainer = document.querySelector('.right');
  if (nicoleContainer) {
      if (!rootMap.has('nicole')) { // Use a unique ID for Nicole's root
          rootMap.set('nicole', ReactDOM.createRoot(nicoleContainer));
      }
      rootMap.get('nicole')?.render(<ErrorBoundary><NicoleVoiceEngine /></ErrorBoundary>);
  }
};

// Call the mounting function
// The initial view ('editor') will be shown by window.show in index.html's DOMContentLoaded.
// mountComponents() is called here to ensure all roots are initialized.
mountComponents();

// The hiding of the preloader is now managed by index.html after the pact screen interaction.
// setTimeout(hidePreloader, 100);