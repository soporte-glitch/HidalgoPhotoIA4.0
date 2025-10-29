
import React from 'react';
import type { NavItem } from './types';

const IconImage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
);

const IconChat = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

const IconContract = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);

const IconMap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10.5c.6.6.6 1.5 0 2.1l-3 3c-.6.6-1.5.6-2.1 0l-4-4c-.6-.6-.6-1.5 0-2.1l7-7c.6-.6 1.5-.6 2.1 0l3 3c.6.6.6 1.5 0 2.1l-3 3z"></path><path d="m9.5 7.5 5 5"></path><path d="m14.5 17.5 5-5"></path></svg>
);

const IconCoupon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v1a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1a3 3 0 0 1 0-6V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg>
);

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
);


export const NAV_ITEMS: NavItem[] = [
  { id: 'imageGenerator', label: 'Generador de Imágenes', icon: <IconImage /> },
  { id: 'chatBot', label: 'Asesor IA', icon: <IconChat /> },
  { id: 'contractBuilder', label: 'Contratos', icon: <IconContract /> },
  { id: 'tableMapper', label: 'Mapping de Mesas', icon: <IconMap /> },
  { id: 'couponWallet', label: 'Cuponera Digital', icon: <IconCoupon /> },
  { id: 'recruitment', label: 'Reclutamiento', icon: <IconUsers /> },
];
