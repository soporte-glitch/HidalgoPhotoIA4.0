import type { ReactNode } from 'react';

export interface ImageData {
  base64: string;
  mimeType: string;
  name: string;
}

export type View = 
  | 'photoEditor'
  | 'imageGenerator'
  | 'atuendoIA'
  | 'panoramaPro'
  | 'videoExperience'
  | 'nayaAssistant';

export interface NavItem {
  id: View;
  label: string;
  icon: ReactNode;
}