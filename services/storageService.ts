import type { View } from '../components/types';

const LAST_VIEW_KEY = 'hidalgo_ultra_suite_last_view';

/**
 * Guarda la vista actual en el almacenamiento local.
 * @param view - La vista a guardar.
 */
export const saveCurrentView = (view: View): void => {
  try {
    localStorage.setItem(LAST_VIEW_KEY, view);
  } catch (error) {
    console.error("No se pudo guardar la vista en localStorage:", error);
  }
};

/**
 * Obtiene la última vista guardada o devuelve la vista por defecto.
 * @returns La última vista guardada o 'photoEditor'.
 */
export const getInitialView = (): View => {
  try {
    const savedView = localStorage.getItem(LAST_VIEW_KEY);
    // Valida que la vista guardada sea una de las vistas válidas.
    if (savedView && ['photoEditor', 'imageGenerator', 'atuendoIA', 'panoramaPro', 'videoExperience', 'nayaAssistant'].includes(savedView)) {
      return savedView as View;
    }
    return 'photoEditor'; // Vista por defecto actualizada al editor de fotos.
  } catch (error) {
    console.error("No se pudo leer la vista de localStorage:", error);
    return 'photoEditor'; // Vista por defecto en caso de error
  }
};