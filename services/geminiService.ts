// Importa los módulos necesarios de la SDK de Google GenAI.
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { ImageData } from '../components/types';
import type { Layout } from './layoutPlanner';

const HIGH_QUALITY_PROMPT_ADDITION = ` renderiza el resultado final en calidad ultra-detallada 8K. Aplica renderizado fotorrealista de alto nivel con enfoque preciso y texturas ricas. La imagen debe tener una claridad y nitidez impecables, sin artefactos ni pérdida de calidad.`;

/**
 * Función para editar una imagen basada en una descripción de texto.
 * Utiliza el modelo gemini-2.5-flash-image, optimizado para tareas de edición rápida de imágenes.
 * @param originalImage - El objeto de la imagen original.
 * @param prompt - La instrucción de texto que describe la edición.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen editada.
 */
export const editImageWithPrompt = async (originalImage: ImageData, prompt: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: originalImage.base64, mimeType: originalImage.mimeType } },
          { text: prompt },
        ],
      },
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
    console.error("Error al llamar a la API de Gemini para edición:", error);
    if (error instanceof Error && (error.message.includes("bloqueada") || error.message.includes("seguridad"))) {
        throw error;
    }
    throw new Error("Fallo al editar la imagen desde la API.");
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
            model: 'imagen-4.0-generate-001', // Se mantiene el modelo superior para generación de alta calidad.
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
        console.error('Error al llamar a la API de Gemini para generación:', error);
        throw new Error('Fallo al generar la imagen desde la API.');
    }
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
        console.error("Error en replaceBackground:", error);
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
        console.error("Error al llamar a la API de Gemini para edición de graduación:", error);
        if (error instanceof Error && (error.message.includes("bloqueada") || error.message.includes("seguridad"))) {
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
- **IMAGEN 5 (Fondo):** Coloca a la persona resultante en el fondo o salón de eventos de esta imagen. La iluminación sobre la persona (sombras, reflejos) debe coincidir perfectamente con la iluminación del fondo para una integración impecable.

El resultado final debe ser una imagen cohesiva, sin artefactos, y completamente fotorrealista. La integración de los elementos debe ser invisible.`;

    if (inputs.enhanceQuality) {
        prompt += HIGH_QUALITY_PROMPT_ADDITION;
    }

    const parts: any[] = [{ inlineData: { data: inputs.model.base64, mimeType: inputs.model.mimeType } }];
    if (inputs.dress) parts.push({ inlineData: { data: inputs.dress.base64, mimeType: inputs.dress.mimeType } });
    if (inputs.hair) parts.push({ inlineData: { data: inputs.hair.base64, mimeType: inputs.hair.mimeType } });
    if (inputs.makeup) parts.push({ inlineData: { data: inputs.makeup.base64, mimeType: inputs.makeup.mimeType } });
    if (inputs.background) parts.push({ inlineData: { data: inputs.background.base64, mimeType: inputs.background.mimeType } });
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
            throw new Error("La solicitud fue bloqueada por motivos de seguridad. Prueba con imágenes diferentes.");
        }
        throw new Error("No se generó ninguna imagen. La solicitud pudo haber sido bloqueada o no produjo un resultado válido.");
    } catch (error) {
        console.error("Error al llamar a la API de Gemini para Virtual Look:", error);
        if (error instanceof Error && (error.message.includes("bloqueada") || error.message.includes("seguridad"))) {
            throw error;
        }
        throw new Error("Fallo al generar la imagen desde la API.");
    }
};

/**
 * Crea una imagen de "novia virtual" combinando múltiples imágenes de referencia.
 */
export const createVirtualBride = async (inputs: VirtualLookInputs): Promise<string> => {
    const context = "Actúa como un director de arte digital experto en fotocomposición de bodas. Tu tarea es crear una única imagen fotorrealista de una 'novia virtual' combinando elementos de las siguientes imágenes de referencia.";
    return createVirtualLook(inputs, context);
};

/**
 * Crea una imagen de "quinceañera virtual" combinando múltiples imágenes de referencia.
 */
export const createVirtualQuinceanera = async (inputs: VirtualLookInputs): Promise<string> => {
    const context = "Actúa como un director de arte digital experto en fotocomposición para celebraciones de Quince Años. Tu tarea es crear una única imagen fotorrealista de una 'quinceañera virtual' combinando elementos de las siguientes imágenes de referencia, con un estilo juvenil, vibrante y elegante.";
    return createVirtualLook(inputs, context);
};

export type TableAssignment = {
    tableName: string;
    guests: string[];
}[];
/**
 * Asigna invitados a mesas usando IA.
 * @param guests - Lista de nombres de invitados.
 * @param tableNames - Nombres/IDs de las mesas disponibles del plano.
 * @returns Una promesa que se resuelve con la asignación de mesas en formato JSON.
 */
export const assignGuestsToTables = async (guests: string[], tableNames: string[]): Promise<TableAssignment> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Actúa como un organizador de eventos experto. Tu tarea es asignar la siguiente lista de invitados a las mesas disponibles de la forma más equitativa posible.
    
    Lista de Invitados:
    ${guests.join('\n')}
    
    Mesas Disponibles (usa estos nombres/IDs exactos para 'tableName'): ${tableNames.join(', ')}
    
    Por favor, distribuye a los invitados entre las mesas. El resultado debe ser únicamente el objeto JSON especificado en el schema, sin texto adicional.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "Una lista de todas las mesas con los invitados asignados a cada una.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            tableName: {
                                type: Type.STRING,
                                description: "El nombre o ID exacto de la mesa (ej. 'round-table-1')."
                            },
                            guests: {
                                type: Type.ARRAY,
                                description: "Una lista con los nombres de los invitados sentados en esta mesa.",
                                items: {
                                    type: Type.STRING
                                }
                            }
                        },
                        required: ["tableName", "guests"],
                    }
                },
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        return result as TableAssignment;

    } catch (error) {
        console.error("Error al llamar a la API de Gemini para asignación de mesas:", error);
        throw new Error("Fallo al generar la asignación de mesas desde la API.");
    }
};

/**
 * Genera un layout de salón de eventos a partir de una descripción en lenguaje natural.
 * @param prompt - Descripción del layout deseado.
 * @param salonWidth - Ancho del lienzo del salón.
 * @param salonHeight - Alto del lienzo del salón.
 * @returns Una promesa que se resuelve con un array de objetos de layout.
 */
export const generateLayoutFromPrompt = async (prompt: string, salonWidth: number, salonHeight: number): Promise<Layout> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `Actúa como un diseñador de eventos profesional y arquitecto de espacios. Tu tarea es interpretar la descripción del usuario y generar un plano 2D (layout) para un salón de eventos.

**REGLAS CRÍTICAS:**
1.  **Respeta las Dimensiones:** El salón mide ${salonWidth}px de ancho por ${salonHeight}px de alto. Todos los objetos deben estar DENTRO de estos límites. El origen (0,0) es la esquina superior izquierda.
2.  **Dimensiones Fijas:** Utiliza estas dimensiones EXACTAS para los objetos:
    -   Mesa Redonda ('round-table'): 48x48 px
    -   Mesa Rectangular ('rect-table'): 24x72 px
    -   Pista de Baile ('dance-floor'): 120x120 px
    -   Templete/Escenario ('stage'): 144x72 px
3.  **Evita Colisiones:** Los objetos no deben superponerse. Deja un espacio razonable entre ellos.
4.  **Salida Estricta:** Tu única salida debe ser el objeto JSON que se ajusta al schema proporcionado. No incluyas texto, explicaciones o código adicional.`;

    const fullPrompt = `Por favor, genera un layout para un salón de eventos basado en esta descripción: "${prompt}".`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    description: "Una lista de los objetos que componen el plano del salón.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING, description: "Un identificador único para el objeto (ej. 'round-table-1')." },
                            type: { type: Type.STRING, description: "El tipo de objeto ('round-table', 'rect-table', 'dance-floor', 'stage')." },
                            x: { type: Type.NUMBER, description: "La coordenada X de la esquina superior izquierda." },
                            y: { type: Type.NUMBER, description: "La coordenada Y de la esquina superior izquierda." },
                            width: { type: Type.NUMBER, description: "El ancho del objeto en píxeles." },
                            height: { type: Type.NUMBER, description: "La altura del objeto en píxeles." },
                        },
                        required: ["id", "type", "x", "y", "width", "height"],
                    }
                },
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        return result as Layout;
    } catch (error) {
        console.error("Error al llamar a la API de Gemini para generar el layout:", error);
        throw new Error("Fallo al generar el diseño del salón desde la API.");
    }
};

/**
 * Genera un layout 2D de un salón a partir de una imagen y una descripción.
 * @param venueImage - Imagen del salón real.
 * @param prompt - Descripción del layout.
 * @param dimensions - Dimensiones físicas del salón.
 * @param salonWidth - Ancho en píxeles del lienzo.
 * @param salonHeight - Alto en píxeles del lienzo.
 * @returns Una promesa que se resuelve con el layout.
 */
export const generateLayoutFromImageAndPrompt = async (
    venueImage: ImageData,
    prompt: string,
    dimensions: string,
    salonWidth: number,
    salonHeight: number
): Promise<Layout> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const systemInstruction = `Actúa como un diseñador de eventos experto y arquitecto. Tu tarea es analizar la imagen de un salón real y generar un plano 2D (layout) basado en la descripción del usuario, respetando los espacios y estructura de la imagen.

**REGLAS CRÍTICAS:**
1.  **Análisis Visual:** La imagen proporcionada es la referencia principal. Identifica áreas libres, columnas y la estructura general para posicionar los objetos de forma realista.
2.  **Respeta las Dimensiones:** El plano debe encajar en un lienzo de ${salonWidth}px de ancho por ${salonHeight}px de alto. Las dimensiones reales aproximadas del salón son ${dimensions}.
3.  **Dimensiones Fijas de Objetos:** Utiliza estas dimensiones EXACTAS: 'round-table' (48x48), 'rect-table' (24x72), 'dance-floor' (120x120), 'stage' (144x72).
4.  **Evita Colisiones:** Los objetos no deben superponerse ni con ellos mismos ni con obstáculos visibles en la foto (como columnas).
5.  **Salida JSON Estricta:** Tu única salida debe ser el objeto JSON que se ajusta al schema.`;

    const fullPrompt = `Analiza la imagen del salón proporcionada. Basado en la imagen y esta descripción: "${prompt}", genera el plano 2D.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Usamos pro para mejor análisis de imagen
            contents: [
                { inlineData: { data: venueImage.base64, mimeType: venueImage.mimeType } },
                { text: fullPrompt }
            ],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING }, type: { type: Type.STRING },
                            x: { type: Type.NUMBER }, y: { type: Type.NUMBER },
                            width: { type: Type.NUMBER }, height: { type: Type.NUMBER },
                        },
                        required: ["id", "type", "x", "y", "width", "height"],
                    }
                },
            },
        });
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        return result as Layout;
    } catch (error) {
        console.error("Error en generateLayoutFromImageAndPrompt:", error);
        throw new Error("Fallo al generar el plano desde la imagen.");
    }
};

/**
 * Genera una vista fotorrealista de un salón de eventos poblado.
 * @param venueImage - Imagen del salón real.
 * @param layout - El layout de objetos a integrar.
 * @param ambiencePrompt - Descripción de la ambientación.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen generada.
 */
export const generateRealisticVenueView = async (
    venueImage: ImageData,
    layout: Layout,
    ambiencePrompt: string
): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Convierte el layout a una descripción textual
    const itemCounts: { [key: string]: number } = {};
    layout.forEach(item => {
        itemCounts[item.type] = (itemCounts[item.type] || 0) + 1;
    });
    const layoutDescription = Object.entries(itemCounts)
        .map(([type, count]) => `${count} ${type.replace('-', ' ')}${count > 1 ? 's' : ''}`)
        .join(', ');

    const prompt = `Actúa como un director de arte y artista de renderizado 3D. La **primera imagen** es una fotografía de un salón de eventos real. Tu tarea es poblar este salón con los siguientes elementos de forma fotorrealista: **${layoutDescription}**.
La ambientación general y el estilo deben seguir esta descripción: **"${ambiencePrompt}"**.
Genera una única **vista frontal fotorrealista en calidad 8K** del salón con todos los elementos integrados. La iluminación, sombras, reflejos y perspectiva deben ser impecables y 100% coherentes con la fotografía original para que el resultado sea indistinguible de una foto real.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: venueImage.base64, mimeType: venueImage.mimeType } },
                    { text: prompt }
                ]
            },
            config: { responseModalities: [Modality.IMAGE] }
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
        console.error("Error en generateRealisticVenueView:", error);
        throw new Error("Fallo al generar la vista realista desde la API.");
    }
};


/**
 * Une múltiples imágenes para crear una panorámica.
 * @param images - Un array de objetos de imagen para unir.
 * @param userPrompt - Instrucciones adicionales del usuario.
 * @param enhanceQuality - Si se debe mejorar la calidad a 8K.
 * @returns Una promesa que se resuelve con la URL de datos (base64) de la imagen panorámica.
 */
export const stitchPanorama = async (images: ImageData[], userPrompt: string = '', enhanceQuality: boolean): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let prompt = `Actúa como un experto en composición fotográfica. Tu tarea es unir las siguientes imágenes en una única fotografía panorámica sin costuras.
**REGLAS CRÍTICAS:**
1.  **Análisis de Contenido:** Analiza el contenido y los bordes de cada imagen para determinar el orden correcto de unión (probablemente horizontal).
2.  **Unión Perfecta:** La unión debe ser invisible. Combina las imágenes de manera fotorrealista, alineando perfectamente los elementos y mezclando los bordes.
3.  **Consistencia:** Mantén la consistencia de la iluminación, el color, la exposición y el estilo en toda la imagen panorámica resultante.
4.  **No Deformar:** No deformes ni distorsiones a las personas, rostros u objetos importantes. Preserva la perspectiva natural.
5.  **Rellenado Generativo (si es necesario):** Si la unión crea áreas vacías o bordes irregulares, utiliza relleno generativo para completar la escena de forma natural y coherente con el resto de la imagen.`;

    if (userPrompt) {
        prompt += `\n\n**Instrucciones Adicionales del Usuario:** ${userPrompt}`;
    }

    if (enhanceQuality) {
        prompt += HIGH_QUALITY_PROMPT_ADDITION;
    }

    const parts: any[] = images.map(img => ({
        inlineData: { data: img.base64, mimeType: img.mimeType }
    }));
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
        throw new Error("No se generó ninguna imagen panorámica en la respuesta.");
    } catch (error) {
        console.error("Error en stitchPanorama:", error);
        throw new Error("Fallo al unir las imágenes desde la API.");
    }
};

/**
 * Genera 3 variantes de texto para un anuncio a partir de un texto base.
 * @param baseText - El texto o idea principal para el anuncio.
 * @returns Una promesa que se resuelve con un array de 3 strings con las variantes.
 */
export const generateTextVariations = async (baseText: string): Promise<string[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Actúa como un copywriter experto en redes sociales. Dada la siguiente idea de texto para un anuncio, genera 3 variantes cortas, creativas y persuasivas.

Texto base: "${baseText}"

Tu respuesta DEBE ser únicamente el objeto JSON que se ajusta al schema, sin texto adicional.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        variations: {
                            type: Type.ARRAY,
                            description: "Una lista de 3 variantes de texto para el anuncio.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["variations"]
                },
            },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        // La API puede devolver menos de 3, así que nos aseguramos de manejarlo.
        return (result.variations as string[]).slice(0, 3);

    } catch (error) {
        console.error("Error al llamar a la API de Gemini para generar variantes de texto:", error);
        throw new Error("Fallo al generar las variantes de texto desde la API.");
    }
};


/**
 * Corrige y mejora un texto dictado usando IA.
 * @param text - El texto a corregir.
 * @returns Una promesa que se resuelve con el texto corregido.
 */
export const correctDictatedText = async (text: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API_KEY no configurada.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Actúa como un editor experto. Corrige la gramática y la puntuación del siguiente texto, y mejora su claridad y fluidez sin cambiar el significado original. El texto proviene de un dictado por voz, por lo que puede contener errores.

Texto original: "${text}"

Devuelve únicamente el texto corregido, sin explicaciones ni preámbulos.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error al llamar a la API de Gemini para corregir texto:", error);
        throw new Error("Fallo al corregir el texto desde la API.");
    }
};