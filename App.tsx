import React, { useState, Suspense, lazy } from 'react';
import type { View } from './components/types';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import { getInitialView, saveCurrentView } from './services/storageService';

// Lazy loading de los módulos principales para optimizar la carga inicial
const PhotoEditor = lazy(() => import('./components/PhotoEditor'));
const ImageGenerator = lazy(() => import('./components/ImageGenerator'));
const AtuendoIA = lazy(() => import('./components/AtuendoIA'));
const PanoramaPro = lazy(() => import('./components/PanoramaPro'));
const VideoExperience = lazy(() => import('./components/VideoExperience'));
const NayaAssistant = lazy(() => import('./components/NayaAssistant'));

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(getInitialView());

  const handleSetView = (view: View) => {
    setCurrentView(view);
    saveCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'photoEditor':
        return <PhotoEditor />;
      case 'imageGenerator':
        return <ImageGenerator />;
      case 'atuendoIA':
        return <AtuendoIA />;
      case 'panoramaPro':
        return <PanoramaPro />;
      case 'videoExperience':
        return <VideoExperience />;
      case 'nayaAssistant':
        return <NayaAssistant />;
      default:
        return <PhotoEditor />;
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-accent"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-brand-primary font-sans">
      <Sidebar currentView={currentView} setCurrentView={handleSetView} />
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            {renderView()}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;