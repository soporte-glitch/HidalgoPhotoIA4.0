// Importa los módulos necesarios de la SDK de Google GenAI.
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { ImageData } from '../components/types';
import type { LayoutItem } from './layoutPlanner';

const HIGH_QUALITY_PROMPT_ADDITION = ` renderiza el resultado final en calidad ultra-detallada 8K. Aplica renderizado fotorrealista de alto nivel con enfoque preciso y texturas ricas. La imagen debe tener una claridad y nitidez impecables, sin artefactos ni pérdida de calidad.`;

/**
 * Función para editar una imagen basada en una descripción de texto.
 * Utiliza el modelo gemini-2.5-flash-image, optimizado para tareas de edición rápida de imágenes.
 * @param originalImage - El objeto de la imagen original.
 * @param userPrompt - La instrucción de texto que describe la edición.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen editada.
 */
export const editImageWithPrompt = async (originalImage: ImageData, userPrompt: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Improved prompt engineering for background changes
  const backgroundKeywords = ['fondo', 'background', 'reemplaza el fondo', 'cambia el fondo', 'pon un fondo'];
  const isBackgroundChange = backgroundKeywords.some(keyword => userPrompt.toLowerCase().includes(keyword));

  let structuredPrompt: string;

  if (isBackgroundChange) {
      structuredPrompt = `Tarea: Cambio de fondo fotorrealista.
**REGLAS CRÍTICAS:**
1. **Extracción Perfecta:** Identifica y aísla al sujeto(s) principal(es) de la imagen con una precisión absoluta. Los bordes, especialmente en el cabello o detalles finos, deben ser impecables.
2. **Generación de Fondo:** Crea un nuevo fondo basándote en la descripción: "${userPrompt}". El fondo debe ser de alta calidad, fotorrealista y coherente en perspectiva.
3. **Integración Profesional:** Integra al sujeto en el nuevo fondo. La iluminación, las sombras proyectadas, los reflejos ambientales y la corrección de color deben coincidir perfectamente entre el sujeto y el nuevo fondo para que el resultado sea indistinguible de una fotografía real.
4. **NO ALTERAR AL SUJETO:** El sujeto principal (personas, objetos) no debe ser modificado, deformado o alterado de ninguna manera. Su apariencia original debe ser 100% preservada.`;
  } else {
      structuredPrompt = `Actúa como un experto en edición fotográfica y retocador digital de clase mundial. Tu tarea es editar la imagen proporcionada basándote en la siguiente instrucción con la máxima precisión. Eres capaz de realizar ediciones complejas como inpainting (reconstruir partes), outpainting (expandir la imagen), y modificación de objetos o rostros.

**Reglas Críticas:**
1.  **Fotorrealismo:** El resultado debe ser indistinguishable de una fotografía real. La iluminación, sombras y texturas deben ser impecables y coherentes.
2.  **Preservar Identidad:** Al modificar personas, preserva su identidad y rasgos. Los cambios deben ser naturales.
3.  **Integración Invisible:** Los elementos añadidos deben integrarse sin costuras, respetando el estilo de la foto original.

**Instrucción de Edición:**
"${userPrompt}"`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: originalImage.base64, mimeType: originalImage.mimeType } },
          { text: structuredPrompt },
        ],
      },
      config: { responseModalities: [Modality.IMAGE] },
    });

    const candidate = response.candidates?.[0];

    if (candidate && candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          if (part.inlineData.data.length < 1000) {
              console.warn("Respuesta de IA sospechosa: El tamaño de los datos es muy pequeño.", { length: part.inlineData.data.length });
              throw new Error("La IA generó un resultado inválido o corrupto.");
          }
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    if (candidate?.finishReason === 'SAFETY') {
      console.error("Fallo crítico: La solicitud fue bloqueada por motivos de seguridad de la API.");
      throw new Error("La solicitud fue bloqueada por seguridad. Intenta con otra imagen o descripción.");
    }
    
    throw new Error("La IA no pudo generar la edición solicitada. Intenta de nuevo.");

  } catch (error) {
    console.error("Fallo crítico:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Fallo en la comunicación con el servicio de IA.");
  }
};

/**
 * Función para generar una imagen desde cero a partir de un texto.
 * Utiliza el modelo gemini-2.5-pro para una capacidad de interpretación y calidad de imagen superior.
 * @param prompt - La instrucción de texto que describe la imagen a generar.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen generada.
 */
export const generateImageFromText = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001', 
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error('No se generó ninguna imagen en la respuesta.');
    } catch (error) {
        console.error('Fallo crítico:', error);
        throw new Error('Fallo al generar la imagen desde la API.');
    }
};

/**
 * Mejora una imagen a una resolución y detalle superiores.
 * @param originalImage La imagen a mejorar.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen mejorada.
 */
export const enhanceImageTo8K = async (originalImage: ImageData): Promise<string> => {
    const prompt = `Actúa como un experto en post-producción digital y remasterización de imágenes. Tu única tarea es mejorar esta imagen a una calidad ultra-detallada de 8K.
**REGLAS CRÍTICAS:**
1.  **AUMENTO DE RESOLUCIÓN Y DETALLE:** Aumenta la resolución, la nitidez general y la claridad de la imagen de forma significativa. Realza las texturas y los detalles finos.
2.  **ELIMINACIÓN DE DEFECTOS:** Elimina por completo cualquier artefacto de compresión, ruido digital o grano de la película de forma inteligente, sin perder textura natural.
3.  **NO ALTERAR CONTENIDO:** No alteres el contenido, los sujetos, los colores, la iluminación o la composición de la imagen original. El resultado debe ser una versión fotorrealista y de mayor calidad de la misma fotografía.`;

    return editImageWithPrompt(originalImage, prompt);
};


/**
 * Expande una imagen a un formato panorámico usando IA.
 * @param originalImage - El objeto de la imagen a expandir.
 * @param enhanceQuality - Si es verdadero, añade instrucciones para mejorar la calidad.
 * @param userPrompt - Instrucciones adicionales del usuario para guiar la expansión.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen panorámica.
 */
export const expandImageToPanorama = async (originalImage: ImageData, enhanceQuality: boolean, userPrompt: string = ''): Promise<string> => {
    let prompt = `Actúa como un director de fotografía experto en expansión generativa. Tu tarea es tomar esta imagen y expandirla en un formato panorámico de 16:9.

**REGLA CRÍTICA E INVIOLABLE: NO ALTERAR ROSTROS HUMANOS.**
Bajo ninguna circunstancia debes modificar, distorsionar, regenerar o cambiar los rostros de las personas presentes en la fotografía original. Los rostros deben permanecer 100% intactos y sin ninguna alteración. Esta es la prioridad número uno.

**Instrucciones de Expansión:**
1. Extiende la escena de manera fotorrealista hacia los lados, arriba y abajo.
2. Imagina lo que se encontraría lógicamente fuera del encuadre original (entorno, cuerpos, vestimenta, etc.), pero siempre respetando la regla crítica sobre los rostros.
3. Mantén de forma impecable el estilo, la iluminación, la atmósfera y la paleta de colores de la foto original.
4. La transición entre la imagen original y el contenido generado debe ser completamente invisible y natural.`;
    
    if (userPrompt) {
        prompt += `\n\n**Instrucciones Adicionales del Usuario:** Expande la imagen teniendo en cuenta esta descripción: "${userPrompt}". Integra estos elementos de forma natural en la escena extendida.`;
    }

    if (enhanceQuality) {
        prompt += HIGH_QUALITY_PROMPT_ADDITION;
    }

    return editImageWithPrompt(originalImage, prompt);
};


/**
 * Función para restaurar una foto dañada o antigua usando un prompt especializado.
 * @param originalImage - El objeto de la imagen a restaurar.
 * @param enhanceQuality - Si es verdadero, añade instrucciones para mejorar la calidad.
 * @param userPrompt - Instrucciones adicionales del usuario.
 * @param focusOnFaces - Si es verdadero, añade instrucciones para enfocarse en la restauración facial.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen restaurada.
 */
export const restorePhoto = async (originalImage: ImageData, enhanceQuality: boolean, userPrompt: string = '', focusOnFaces: boolean = false): Promise<string> => {
    let prompt = `Restaura esta fotografía con precisión de experto. Realiza las siguientes acciones:
1.  **Repara Daños:** Elimina por completo cualquier arañazo, rasgadura, polvo y pliegue.
2.  **Corrige el Color:** Si la foto es a color, restaura los colores originales, eliminando el desvanecimiento o dominantes de color. Si es en blanco y negro, mejora el contraste y el rango tonal.
3.  **Mejora la Nitidez:** Aumenta sutilmente la nitidez y la claridad, especialmente en rostros y detalles clave, sin introducir artefactos digitales.
4.  **Reduce el Ruido:** Disminuye suavemente el grano de la película y el ruido, preservando la textura.
El resultado final debe parecer una versión limpia y de alta calidad de la foto original, manteniendo su autenticidad.`;

    if (focusOnFaces) {
        prompt += `\n\n**PRIORIDAD MÁXIMA: RESTAURACIÓN FACIAL.**
Actúa como un experto en restauración digital forense. Enfócate primordialmente en los rostros humanos de la imagen. Realiza las siguientes acciones con la máxima precisión:
1.  **Reconstrucción Facial:** Si los rostros están dañados, desenfocados, o con baja resolución, reconstrúyelos con detalles fotorrealistas. Aclara los ojos, define los contornos faciales y restaura la textura natural de la piel.
2.  **Eliminación de Imperfecciones:** Remueve arañazos, manchas y artefactos de compresión específicamente en las caras.
3.  **Consistencia Global:** Asegúrate de que los rostros restaurados se integren perfectamente con el resto de la imagen, manteniendo la iluminación y el grano originales.`;
    }
    
    if (userPrompt) {
        prompt += `\n\n**Instrucciones adicionales del usuario:** ${userPrompt}. Prioriza estas instrucciones si entran en conflicto con las generales, pero siempre manteniendo el fotorrealismo y la coherencia de la imagen.`;
    }

    if (enhanceQuality) {
        prompt += HIGH_QUALITY_PROMPT_ADDITION;
    }
    
    return editImageWithPrompt(originalImage, prompt);
};


/**
 * Remueve el fondo de una imagen, dejando el sujeto principal.
 * @param originalImage La imagen de la cual remover el fondo.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen con fondo transparente.
 */
export const removeBackground = async (originalImage: ImageData): Promise<string> => {
    const prompt = `Actúa como un experto en edición de fotos con precisión quirúrgica. Tu única tarea es remover el fondo de esta imagen.
**REGLAS CRÍTICAS:**
1.  **Sujeto Principal:** Identifica y aísla perfectamente al sujeto(s) principal(es) en primer plano.
2.  **Bordes Perfectos:** Crea una máscara de recorte impecable alrededor del sujeto, prestando especial atención a detalles finos como el cabello, pelaje o bordes complejos.
3.  **Fondo Transparente:** El fondo debe ser 100% transparente.
4.  **Sin Alteraciones:** No alteres el color, la iluminación o la apariencia del sujeto principal.

El resultado final debe ser una imagen en formato PNG con el sujeto perfectamente recortado sobre un fondo transparente.`;
    return editImageWithPrompt(originalImage, prompt);
};


/**
 * Reemplaza el fondo de una imagen de un sujeto con una nueva imagen de fondo.
 * @param subjectImage La imagen con el sujeto principal.
 * @param backgroundImage La nueva imagen de fondo.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen compuesta.
 */
export const replaceBackground = async (subjectImage: ImageData, backgroundImage: ImageData): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Actúa como un director de arte digital experto en fotocomposición. Tu tarea es integrar perfectamente el sujeto de la **primera imagen** en el escenario de la **segunda imagen (fondo)**.
**REGLAS CRÍTICAS DE COMPOSICIÓN:**
1.  **Extracción del Sujeto:** Primero, extrae al sujeto(s) principal(es) de la primera imagen con bordes perfectos.
2.  **Integración de Iluminación:** Analiza la iluminación de la imagen de fondo (dirección, color, intensidad de las luces y sombras). Aplica una iluminación idéntica al sujeto para que parezca que realmente está en ese entorno. Esto incluye reflejos del ambiente y sombras proyectadas realistas.
3.  **Consistencia de Color y Perspectiva:** Ajusta la corrección de color y el balance de blancos del sujeto para que coincida con la atmósfera del fondo. Asegura que la escala y la perspectiva del sujeto sean correctas para la escena.
4.  **Fotorrealismo:** El resultado final debe ser una única imagen cohesiva y 100% fotorrealista. La composición debe ser indetectable.`;

    const parts: any[] = [
        { inlineData: { data: subjectImage.base64, mimeType: subjectImage.mimeType } },
        { inlineData: { data: backgroundImage.base64, mimeType: backgroundImage.mimeType } },
        { text: prompt }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const candidate = response.candidates?.[0];
        if (candidate && candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        if (candidate?.finishReason === 'SAFETY') {
            throw new Error("La solicitud fue bloqueada por motivos de seguridad.");
        }
        throw new Error("No se generó ninguna imagen en la respuesta.");
    } catch (error) {
        console.error("Fallo crítico:", error);
        throw new Error("Fallo al reemplazar el fondo desde la API.");
    }
};


export interface GraduationOptions {
  togaColor: string;
  sashColor: string;
  sashStyle: 'Tradicional (horizontal)' | 'Tipo "V" (pechera de lujo)';
  background: string;
  customBackground?: string;
  enhanceQuality?: boolean;
}

/**
 * Viste a una persona en una foto con atuendo de graduación usando IA.
 * @param originalImage La imagen original de la persona.
 * @param options Las opciones de personalización para el atuendo.
 * @param referenceToga Imagen de referencia opcional para el estilo de la toga.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen editada.
 */
export const dressForGraduation = async (
    originalImage: ImageData, 
    options: GraduationOptions,
    referenceToga?: ImageData
): Promise<string> => {
    
    const backgroundInstruction = options.background === 'Personalizado (describir)' && options.customBackground
        ? `un fondo fotorrealista que coincida con la siguiente descripción: '${options.customBackground}'`
        : `un entorno profesional de tipo '${options.background}'`;

    let prompt = `Tarea: Edición fotorrealista de atuendo de graduación.
Instrucciones:
1.  **Identifica** a la persona principal en la imagen.`;

    if (referenceToga) {
        prompt += `
    2.  **Vístela** con una toga, birrete y estola que coincidan EXACTAMENTE en estilo, color, textura, reflejos y diseño con la imagen de referencia de la toga proporcionada. La imagen de referencia es la autoridad final para el atuendo.
    3.  **Ignora** cualquier descripción de color de toga/estola y usa la imagen de referencia como única guía para el atuendo.`;
    } else {
        prompt += `
    2.  **Vístela** con una toga y un birrete de graduación de alta calidad y realismo. El color de la toga debe ser **${options.togaColor}**.
    3.  **Añade** una estola/banda de graduación de estilo '${options.sashStyle}' sobre la toga. El color de la estola debe ser **${options.sashColor}**.`;
    }
    
    prompt += `
    4.  **Reemplaza** el fondo por ${backgroundInstruction}.
    5.  **Asegura** que la iluminación sobre la persona coincida perfectamente con el nuevo fondo para una integración sin fisuras.
    6.  **Mantén** el rostro, cabello e identidad de la persona de forma impecable. No alteres sus rasgos.
    7.  El resultado final debe ser una imagen de calidad fotográfica profesional, ultra-realista y cohesiva.`;

    if (options.enhanceQuality) {
        prompt += HIGH_QUALITY_PROMPT_ADDITION;
    }

    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
  
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: any[] = [];
    if (referenceToga) {
        parts.push({ inlineData: { data: referenceToga.base64, mimeType: referenceToga.mimeType } });
    }
    parts.push({ inlineData: { data: originalImage.base64, mimeType: originalImage.mimeType } });
    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const candidate = response.candidates?.[0];

        if (candidate && candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        if (candidate?.finishReason === 'SAFETY') {
            throw new Error("La solicitud fue bloqueada por motivos de seguridad. Intenta con una imagen o descripción diferente.");
        }
        
        throw new Error("No se generó ninguna imagen en la respuesta. La solicitud pudo haber sido bloqueada.");

    } catch (error) {
        console.error("Fallo crítico:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Fallo al generar el atuendo de graduación desde la API.");
    }
};

export interface VirtualLookInputs {
    model: ImageData;
    dress?: ImageData | null;
    hair?: ImageData | null;
    makeup?: ImageData | null;
    background?: ImageData | null;
    enhanceQuality?: boolean;
}

// Fix: This function was incomplete and did not return a value. It has been fully implemented.
const createVirtualLook = async (inputs: VirtualLookInputs, contextPrompt: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let prompt = `${contextPrompt}
**REGLA CRÍTICA INVIOLABLE:**
- **IMAGEN 1 (Modelo Principal):** Esta es la modelo. Utiliza su rostro, estructura facial, tono de piel y complexión física como la base INALTERABLE. **NO CAMBIES SU IDENTIDAD NI SUS RASGOS FACIALES.**

**Instrucciones de Composición (si se proporcionan las imágenes):**
- **IMAGEN 2 (Vestido):** Toma el vestido de esta imagen y vístelo sobre el cuerpo de la modelo principal. Asegúrate de que el ajuste, la tela, los detalles y la caída del vestido sean realistas y se adapten a la pose de la modelo.
- **IMAGEN 3 (Peinado):** Aplica el peinado de esta imagen sobre la cabeza de la modelo principal. Adapta el color y la forma del cabello para que encaje de manera natural.
- **IMAGEN 4 (Maquillaje):** Aplica el estilo de maquillaje de esta imagen al rostro de la modelo principal. Presta atención a los tonos de la sombra de ojos, el labial y el contorno.
- **IMAGEN 5 (Fondo):** Coloca a la persona resultante en el fondo o salón de eventos de esta imagen. La iluminación sobre la persona (sombras, reflejos) sea coherente con el fondo. La composición final debe ser fotorrealista.`;
    
    if (inputs.enhanceQuality) {
        prompt += HIGH_QUALITY_PROMPT_ADDITION;
    }

    const parts: any[] = [];
    parts.push({ inlineData: { data: inputs.model.base64, mimeType: inputs.model.mimeType } });
    if (inputs.dress) {
        parts.push({ inlineData: { data: inputs.dress.base64, mimeType: inputs.dress.mimeType } });
    }
    if (inputs.hair) {
        parts.push({ inlineData: { data: inputs.hair.base64, mimeType: inputs.hair.mimeType } });
    }
    if (inputs.makeup) {
        parts.push({ inlineData: { data: inputs.makeup.base64, mimeType: inputs.makeup.mimeType } });
    }
    if (inputs.background) {
        parts.push({ inlineData: { data: inputs.background.base64, mimeType: inputs.background.mimeType } });
    }
    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const candidate = response.candidates?.[0];
        if (candidate && candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        if (candidate?.finishReason === 'SAFETY') {
            throw new Error("La solicitud fue bloqueada por motivos de seguridad.");
        }
        throw new Error("No se generó ninguna imagen en la respuesta.");
    } catch (error) {
        console.error("Fallo crítico:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Fallo al crear el look virtual desde la API.");
    }
};

// Fix: Added missing function createVirtualBride
export const createVirtualBride = async (inputs: VirtualLookInputs): Promise<string> => {
    const contextPrompt = `Actúa como un diseñador de moda y estilista de bodas de alta costura. Tu tarea es crear una prueba de look virtual (makeover) para una novia, combinando diferentes elementos de forma fotorrealista.`;
    return createVirtualLook(inputs, contextPrompt);
};

// Fix: Added missing function createVirtualQuinceanera
export const createVirtualQuinceanera = async (inputs: VirtualLookInputs): Promise<string> => {
    const contextPrompt = `Actúa como un diseñador de moda y estilista experto en fiestas de quince años. Tu tarea es crear una prueba de look virtual (makeover) para una quinceañera, combinando diferentes elementos de forma fotorrealista.`;
    return createVirtualLook(inputs, contextPrompt);
};

// Fix: Added missing function stitchPanorama
export const stitchPanorama = async (images: ImageData[], userPrompt: string, enhanceQuality: boolean): Promise<string> => {
    let prompt = `Actúa como un experto en fotografía computacional. Tu tarea es unir estas ${images.length} imágenes en una sola fotografía panorámica fotorrealista.
**Instrucciones de Unión:**
1.  Analiza el solapamiento y la perspectiva entre las imágenes para crear una transición invisible.
2.  Corrige cualquier distorsión de lente y alinea los horizontes perfectamente.
3.  Asegura que la exposición, el balance de blancos y los colores sean consistentes a lo largo de toda la panorámica.
4.  Si es necesario, utiliza relleno generativo para completar áreas faltantes en los bordes y crear un encuadre rectangular limpio.
5.  **NO ALTERAR ROSTROS HUMANOS.** Los rostros deben permanecer intactos y sin distorsiones.`;
    if (userPrompt) {
        prompt += `\n\n**Instrucciones Adicionales del Usuario:** ${userPrompt}.`;
    }
    if (enhanceQuality) {
        prompt += HIGH_QUALITY_PROMPT_ADDITION;
    }

    // Fix: Correctly construct the `parts` array to allow both image and text parts,
    // resolving a TypeScript error from incorrect type inference.
    const parts = [
        ...images.map(img => ({ inlineData: { data: img.base64, mimeType: img.mimeType } })),
        { text: prompt },
    ];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const candidate = response.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData?.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        if (candidate?.finishReason === 'SAFETY') {
            throw new Error("La solicitud fue bloqueada por motivos de seguridad.");
        }
        throw new Error("No se pudo unir la panorámica.");
    } catch (error) {
        console.error("Fallo crítico al unir panorámica:", error);
        if (error instanceof Error) throw error;
        throw new Error("Fallo en la comunicación con la API al unir la panorámica.");
    }
};

/**
 * Genera una nueva imagen sintetizando los conceptos de dos imágenes de entrada y un prompt.
 * @param image1 Primera imagen de anclaje.
 * @param image2 Segunda imagen de anclaje.
 * @param prompt El concepto catalizador que guía la síntesis.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen sintetizada.
 */
export const synthesizeConcepts = async (image1: ImageData, image2: ImageData, prompt: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const structuredPrompt = `Actúa como un director de arte surrealista y un genio conceptual. Tu tarea es sintetizar una nueva imagen a partir de los dos conceptos visuales proporcionados (la primera y segunda imagen). 
**REGLAS CRÍTICAS:**
1.  **NO FUSIONAR:** No mezcles, combines ni superpongas las imágenes directamente.
2.  **SÍNTESIS CONCEPTUAL:** En su lugar, extrae la esencia, el estilo, los objetos y la atmósfera de AMBAS imágenes.
3.  **CREACIÓN GUIADA:** Usa esa esencia extraída para generar una obra de arte COMPLETAMENTE NUEVA y ORIGINAL, guiada por el siguiente concepto catalizador: "${prompt}".
4.  **FOTORREALISMO IMPACTANTE:** El resultado final debe ser una pieza visualmente impactante, cohesiva y fotorrealista que parezca una creación única e intencional.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: image1.base64, mimeType: image1.mimeType } },
          { inlineData: { data: image2.base64, mimeType: image2.mimeType } },
          { text: structuredPrompt },
        ],
      },
      config: { responseModalities: [Modality.IMAGE] },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("La solicitud fue bloqueada por seguridad. Intenta con otras imágenes o un concepto diferente.");
    }
    throw new Error("La IA no pudo sintetizar el concepto. Intenta de nuevo.");
  } catch (error) {
    console.error("Fallo crítico en la síntesis conceptual:", error);
    if (error instanceof Error) throw error;
    throw new Error("Fallo en la comunicación con el servicio de IA.");
  }
};

// --- Funciones para el Diseñador de Salones ---

const layoutSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      description: 'Lista de elementos a colocar en el plano del salón.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Identificador único para el elemento.' },
          type: { type: Type.STRING, description: 'Tipo de elemento (ej. round-table, dance-floor).' },
          x: { type: Type.NUMBER, description: 'Coordenada X de la esquina superior izquierda.' },
          y: { type: Type.NUMBER, description: 'Coordenada Y de la esquina superior izquierda.' },
          width: { type: Type.NUMBER, description: 'Ancho del elemento.' },
          height: { type: Type.NUMBER, description: 'Alto del elemento.' },
        },
        required: ['id', 'type', 'x', 'y', 'width', 'height'],
      },
    },
  },
  required: ['items'],
};

export const generateLayoutFromPrompt = async (prompt: string, canvasWidth: number, canvasHeight: number): Promise<LayoutItem[]> => {
  if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `Eres un experto planificador de eventos y diseñador de interiores. Tu tarea es generar un plano de distribución para un salón de eventos.
- El lienzo disponible es de ${canvasWidth}px de ancho por ${canvasHeight}px de alto.
- Los elementos deben estar dentro de estos límites.
- Tipos de elementos permitidos: 'round-table' (48x48px), 'rect-table' (24x72px), 'dance-floor' (120x120px), 'stage' (144x72px).
- Asigna las dimensiones correctas a cada tipo de elemento.
- Genera un ID único para cada elemento (ej. 'round-table-1').
- Responde únicamente con el objeto JSON que se adhiere al schema proporcionado. No incluyas texto adicional ni explicaciones.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: layoutSchema,
    },
  });
  
  const jsonText = response.text.trim();
  try {
    const layout = JSON.parse(jsonText);
    return layout.items || [];
  } catch (e) {
    console.error("Error al parsear el JSON del layout:", e, jsonText);
    throw new Error("La IA no pudo generar un plano válido.");
  }
};

export const generateLayoutFromImageAndPrompt = async (image: ImageData, prompt: string, dimensions: string, canvasWidth: number, canvasHeight: number): Promise<LayoutItem[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `Eres un experto planificador de eventos y diseñador de interiores con capacidad de análisis visual. Tu tarea es generar un plano de distribución para un salón de eventos basándote en una foto del lugar y una descripción.
- La foto proporcionada es del salón vacío. Analízala para entender sus límites, columnas u obstrucciones.
- Las dimensiones reales del salón son ${dimensions}. El lienzo digital es de ${canvasWidth}px de ancho por ${canvasHeight}px de alto. Escala tus cálculos.
- Los elementos deben estar dentro de los límites del salón en la foto.
- Tipos de elementos permitidos y sus dimensiones en px: 'round-table' (48x48), 'rect-table' (24x72), 'dance-floor' (120x120), 'stage' (144x72).
- Asigna las dimensiones correctas a cada tipo de elemento.
- Genera un ID único para cada elemento (ej. 'round-table-1').
- Responde únicamente con el objeto JSON que se adhiere al schema proporcionado.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Usar un modelo más potente para análisis de imagen
        contents: {
            parts: [
                { inlineData: { data: image.base64, mimeType: image.mimeType } },
                { text: prompt }
            ]
        },
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: layoutSchema,
        },
    });

    const jsonText = response.text.trim();
    try {
        const layout = JSON.parse(jsonText);
        return layout.items || [];
    } catch (e) {
        console.error("Error al parsear el JSON del layout multimodal:", e, jsonText);
        throw new Error("La IA no pudo generar un plano válido desde la imagen.");
    }
};

export const generateRealisticVenueView = async (venueImage: ImageData, layout: LayoutItem[], ambiencePrompt: string): Promise<string> => {
    const layoutDescription = layout.map(item => `- Un(a) ${item.type} de ${item.width}x${item.height}px en la posición (x:${Math.round(item.x)}, y:${Math.round(item.y)})`).join('\n');

    const prompt = `Actúa como un director de arte y experto en renderizado 3D. Tu tarea es crear una vista fotorrealista de un salón de eventos decorado.
**INSTRUCCIONES CRÍTICAS:**
1.  **BASE DEL SALÓN:** Utiliza la imagen proporcionada como la arquitectura base del salón (paredes, techo, suelo, ventanas). NO alteres su estructura fundamental.
2.  **POBLAR EL SALÓN:** Integra los siguientes elementos de mobiliario en el salón, respetando sus posiciones relativas como si fuera una vista en perspectiva desde la entrada. El plano de distribución 2D es:
${layoutDescription}
3.  **AMBIENTACIÓN Y ESTILO:** Aplica la siguiente temática de decoración y ambiente a toda la escena: "${ambiencePrompt}". Esto incluye la iluminación, los colores, los materiales del mobiliario (manteles, sillas), y la decoración general.
4.  **HIPERREALISMO 8K:** El resultado final debe ser una imagen indistinguible de una fotografía profesional de alta resolución (8K), con sombras realistas, reflejos, texturas detalladas y una iluminación cohesiva.`;
    
    return editImageWithPrompt(venueImage, prompt);
};

export const correctDictatedText = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Corrige la gramática, puntuación y claridad del siguiente texto, que proviene de un dictado por voz. Hazlo más conciso y claro para una instrucción de IA. Responde únicamente con el texto corregido.\n\nTexto original: "${text}"`,
  });

  return response.text.trim();
};

export const generateTextVariations = async (originalText: string): Promise<string[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Eres un copywriter experto en marketing para redes sociales. Basado en el siguiente texto para un anuncio, genera 3 variaciones cortas y persuasivas (máximo 15 palabras cada una). Deben ser llamativas y perfectas para un Reel o Story. Devuelve solo un array JSON de strings, así: ["texto 1", "texto 2", "texto 3"].\n\nTexto base: "${originalText}"`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        },
    });

    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Error al parsear variaciones de texto:", e, response.text);
        return [`✨ ${originalText} ✨`, `¡No te lo pierdas! ${originalText}`, `Vive la magia: ${originalText}`];
    }
};

/**
 * Genera un pie de foto descriptivo para una imagen.
 * @param image La imagen para la cual generar el pie de foto.
 * @returns Una promesa que se resuelve con el texto del pie de foto.
 */
export const generateImageCaption = async (image: ImageData): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Actúa como un copywriter creativo para redes sociales. Describe esta imagen en una sola frase corta, poética y atractiva (máximo 15 palabras). El tono debe ser inspirador o evocador. Responde únicamente con el texto del pie de foto.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: image.base64, mimeType: image.mimeType } },
          { text: prompt },
        ],
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Fallo crítico en la generación de pie de foto:", error);
    if (error instanceof Error) {
        if (JSON.stringify(error).includes('SAFETY')) {
             throw new Error("La imagen fue bloqueada por políticas de seguridad.");
        }
        throw error;
    }
    throw new Error("Fallo en la comunicación con el servicio de IA para el pie de foto.");
  }
};