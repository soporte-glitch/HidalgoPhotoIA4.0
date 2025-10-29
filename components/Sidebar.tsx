import React, { useState } from 'react';
import type { View, NavItem } from './types';

// Iconos para la nueva suite
const IconGenerator = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconPhotoEditor = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22h-8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8"/><path d="m22 7-8.5 8.5-4-4L2 15"/><path d="M18 22v-6"/><path d="M15 19l3-3 3 3"/></svg>;
const IconAtuendoIA = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/><path d="M6.3 21.7C5.5 21 5 20 5 19v-2.7c0-.5.2-1 .6-1.4L11 9l-2.5-2.5c-.8-.8-2-1.3-3.2-1.3H4"/><path d="M17.7 21.7c.8-.7 1.3-1.7 1.3-2.7v-2.7c0-.5-.2-1-.6-1.4L13 9l2.5-2.5c.8-.8 2-1.3 3.2-1.3H20"/></svg>;
const IconPanoramaPro = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2 2 6.48 2 12z"/><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><path d="M12 12v10"/></svg>;
const IconVideoExperience = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>;
const IconNayaAssistant = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h1Z"/><path d="M16 8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1Z"/><path d="M8 14a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1Z"/><path d="M18 16a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1Z"/><path d="M6 20a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1Z"/></svg>;

const NAV_ITEMS: (NavItem & { disabled?: boolean })[] = [
  { id: 'photoEditor', label: 'Editor de Fotos', icon: <IconPhotoEditor /> },
  { id: 'imageGenerator', label: 'Generador IA', icon: <IconGenerator /> },
  { id: 'atuendoIA', label: 'Atuendo IA', icon: <IconAtuendoIA /> },
  { id: 'panoramaPro', label: 'Panorama Pro', icon: <IconPanoramaPro /> },
  { id: 'videoExperience', label: 'Video Experience', icon: <IconVideoExperience /> },
  { id: 'nayaAssistant', label: 'Asistente NAYA', icon: <IconNayaAssistant /> },
];

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    const NavLinks = () => NAV_ITEMS.map((item) => (
        <a
            key={item.id}
            href="#"
            onClick={(e) => { 
                e.preventDefault(); 
                if (!item.disabled) {
                    setCurrentView(item.id); 
                    setMobileMenuOpen(false); 
                }
            }}
            className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
            currentView === item.id
                ? 'bg-brand-accent text-brand-primary shadow-lg'
                : 'text-brand-text-secondary hover:bg-brand-primary hover:text-brand-text'
            } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="flex items-center">
                <span className="mr-3">{item.icon}</span>
                {item.label}
            </div>
            {item.disabled && <span className="text-xs bg-brand-primary text-brand-text-secondary px-2 py-0.5 rounded-full">Próximamente</span>}
        </a>
    ));

  return (
    <>
        <div className="md:hidden fixed top-0 left-0 right-0 bg-brand-secondary z-20 shadow-lg">
            <div className="flex justify-between items-center p-4">
                <h1 className="text-xl font-serif text-brand-text">Hidalgo <span className="text-brand-accent">Suite</span></h1>
                <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="text-brand-text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6h18M3 12h18M3 18h18"/></svg>
                </button>
            </div>
            {isMobileMenuOpen && <nav className="p-4 pt-0 space-y-2"><NavLinks /></nav>}
        </div>
        
        <aside className="hidden md:flex flex-col w-64 bg-brand-secondary p-4 space-y-6 flex-shrink-0">
            <div className="px-2">
                <h1 className="text-3xl font-serif text-brand-text">Hidalgo <span className="text-brand-accent">Suite</span></h1>
                <p className="text-xs text-brand-text-secondary font-sans">Ultra Suite v4.3</p>
            </div>
            <nav className="flex-1 space-y-2"><NavLinks /></nav>
            <div className="px-4 py-2 text-center text-xs text-brand-text-secondary">&copy; {new Date().getFullYear()} Hidalgo Corp.</div>
        </aside>

        <div className="pt-20 md:pt-0"></div>
    </>
  );
};

export default Sidebar;