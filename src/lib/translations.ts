import { type Face, FACE_NAMES } from "./constants";

export type AssistantLanguage = "en" | "es";

export interface AssistantStrings {
  readyPrompt: (face: Face) => string;
  wrongFaceWarning: (detected: Face, expected: Face) => string;
  holdSteady: string;
  captureSuccess: (face: Face, nextFace: Face | null) => string;
  allDone: string;
  rotateHelp: (face: Face) => string;
  movePrompt: (move: string) => string;
  diagnosticReasons: Record<string, string>;
  repairButton: string;
  repairLoading: string;
  repairModalTitle: string;
  repairModalIntro: string;
  repairApply: string;
  repairCancel: string;
  repairSuggestion: (face: string, index: number, from: string, to: string, reason: string) => string;
}

export const TRANSLATIONS: Record<AssistantLanguage, AssistantStrings> = {
  en: {
    readyPrompt: (face) => `Let's scan the ${FACE_NAMES[face]} face.`,
    wrongFaceWarning: (detected, expected) => 
      `Wait, that's the ${FACE_NAMES[detected]} face. Please turn to ${FACE_NAMES[expected]}.`,
    holdSteady: "Hold steady...",
    captureSuccess: (face, next) => 
      `${FACE_NAMES[face]} saved. ${next ? `Now rotate to the ${FACE_NAMES[next]} face.` : ""}`,
    allDone: "All faces scanned! Let's solve your cube.",
    rotateHelp: (face) => {
      if (face === 'R' || face === 'B' || face === 'L') return "Rotate the cube 90 degrees to the right.";
      if (face === 'U') return "Tip the cube forward.";
      if (face === 'D') return "Roll the cube backward twice.";
      return "";
    },
    movePrompt: (move) => `Next move: ${move}`,
    diagnosticReasons: {
      opposite_faces: "Opposite colors (like Red/Orange) cannot be on the same piece.",
      duplicate_faces: "A piece cannot have the same color twice.",
      impossible_colors: "This sticker combination doesn't exist on a standard cube.",
      impossible_combination: "This specific combination of colors is mathematically impossible.",
    },
    repairButton: "AI Repair Assist",
    repairLoading: "AI is analyzing your cube...",
    repairModalTitle: "AI Repair Suggestions",
    repairModalIntro: "The AI found the following likely scan errors. Review and apply to fix your cube:",
    repairApply: "Apply Fixes",
    repairCancel: "Cancel",
    repairSuggestion: (face, index, from, to, reason) => 
      `Change ${face} sticker ${index + 1} from ${from} to ${to}. (${reason})`,
  },
  es: {
    readyPrompt: (face) => {
      const faceNameEs = FACE_NAMES_ES[face];
      return `Vamos a escanear la cara ${faceNameEs}.`;
    },
    wrongFaceWarning: (detected, expected) => 
      `¡Espera! Esa es la cara ${FACE_NAMES_ES[detected]}. Por favor gira a la ${FACE_NAMES_ES[expected]}.`,
    holdSteady: "Manténlo quieto...",
    captureSuccess: (face, next) => 
      `Cara ${FACE_NAMES_ES[face]} guardada. ${next ? `Ahora gira a la cara ${FACE_NAMES_ES[next]}.` : ""}`,
    allDone: "¡Todas las caras escaneadas! Vamos a resolver tu cubo.",
    rotateHelp: (face) => {
      if (face === 'R' || face === 'B' || face === 'L') return "Gira el cubo 90 grados a la derecha.";
      if (face === 'U') return "Inclina el cubo hacia adelante.";
      if (face === 'D') return "Gira el cubo hacia atrás dos veces.";
      return "";
    },
    movePrompt: (move) => `Siguiente movimiento: ${move}`,
    diagnosticReasons: {
      opposite_faces: "Colores opuestos (como Rojo/Naranja) no pueden estar en la misma pieza.",
      duplicate_faces: "Una pieza no puede tener el mismo color dos veces.",
      impossible_colors: "Esta combinación de colores no existe en un cubo estándar.",
      impossible_combination: "Esta combinación específica es matemáticamente imposible.",
    },
    repairButton: "Asistente de Reparación AI",
    repairLoading: "La IA está analizando tu cubo...",
    repairModalTitle: "Sugerencias de Reparación AI",
    repairModalIntro: "La IA encontró los siguientes errores probables. Revisa y aplica para corregir tu cubo:",
    repairApply: "Aplicar Correcciones",
    repairCancel: "Cancelar",
    repairSuggestion: (face, index, from, to, reason) => 
      `Cambiar pegatina ${index + 1} de la cara ${face} de ${from} a ${to}. (${reason})`,
  },
};

const MOVE_NAMES_EN: Record<string, string> = {
  U: "Up face, clockwise",
  "U'": "Up face, counter-clockwise",
  U2: "Up face, twice",
  D: "Down face, clockwise",
  "D'": "Down face, counter-clockwise",
  D2: "Down face, twice",
  L: "Left face, clockwise",
  "L'": "Left face, counter-clockwise",
  L2: "Left face, twice",
  R: "Right face, clockwise",
  "R'": "Right face, counter-clockwise",
  R2: "Right face, twice",
  F: "Front face, clockwise",
  "F'": "Front face, counter-clockwise",
  F2: "Front face, twice",
  B: "Back face, clockwise",
  "B'": "Back face, counter-clockwise",
  B2: "Back face, twice",
};

const MOVE_NAMES_ES: Record<string, string> = {
  U: "Cara superior, derecha",
  "U'": "Cara superior, izquierda",
  U2: "Cara superior, doble giro",
  D: "Cara inferior, derecha",
  "D'": "Cara inferior, izquierda",
  D2: "Cara inferior, doble giro",
  L: "Cara izquierda, derecha",
  "L'": "Cara izquierda, izquierda",
  L2: "Cara izquierda, doble giro",
  R: "Cara derecha, derecha",
  "R'": "Cara derecha, izquierda",
  R2: "Cara derecha, doble giro",
  F: "Cara frontal, derecha",
  "F'": "Cara frontal, izquierda",
  F2: "Cara frontal, doble giro",
  B: "Cara posterior, derecha",
  "B'": "Cara posterior, izquierda",
  B2: "Cara posterior, doble giro",
};

export function getMoveSpokenName(notation: string, lang: AssistantLanguage): string {
  const map = lang === 'en' ? MOVE_NAMES_EN : MOVE_NAMES_ES;
  return map[notation] || notation;
}

const FACE_NAMES_ES: Record<Face, string> = {
  U: "Superior (Blanca)",
  D: "Inferior (Amarilla)",
  F: "Frontal (Verde)",
  B: "Posterior (Azul)",
  L: "Izquierda (Naranja)",
  R: "Derecha (Roja)",
};
