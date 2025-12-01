import type { MoodboardElement } from "@/app/moodboard/lib/moodboardTypes";

export interface MoodboardTemplate {
  id: string;
  title: string;
  description: string;
  previewColor: string;
  elements: MoodboardElement[];
}

// Helpers
function elImage(id: string, x: number, y: number, width: number, height: number, imageUrl: string): MoodboardElement {
  return {
    id,
    type: "image",
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    data: { imageUrl },
  };
}

function elText(id: string, x: number, y: number, width: number, height: number, text: string): MoodboardElement {
  return {
    id,
    type: "text",
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    data: { textContent: text },
  };
}

export const MOODBOARD_TEMPLATES: MoodboardTemplate[] = [
  {
    id: "warm-collage",
    title: "Collage cálido",
    description: "Fotos principales grandes con notas manuscritas.",
    previewColor: "#fef3c7",
    elements: [
      elImage("t1-main", 80, 80, 340, 220, "/images/hero-carpinteria-2.svg"),
      elImage("t1-side", 360, 210, 220, 180, "/images/hero-carpinteria-3.svg"),
      elImage("t1-detail", 120, 260, 180, 160, "/images/hero-carpinteria-1.svg"),
      elText(
        "t1-note",
        120,
        440,
        260,
        80,
        "New Spaces\n• Luz cálida\n• Tonos tierra\n• Texturas naturales"
      ),
    ],
  },
  {
    id: "grid-gallery",
    title: "Galería 2x3",
    description: "Seis bloques iguales para mostrar opciones.",
    previewColor: "#e5e7eb",
    elements: [
      elImage("t2-1", 60, 80, 180, 150, "/logo-default.svg"),
      elImage("t2-2", 250, 80, 180, 150, "/logo-default.svg"),
      elImage("t2-3", 440, 80, 180, 150, "/logo-default.svg"),
      elImage("t2-4", 60, 240, 180, 150, "/logo-default.svg"),
      elImage("t2-5", 250, 240, 180, 150, "/logo-default.svg"),
      elImage("t2-6", 440, 240, 180, 150, "/logo-default.svg"),
    ],
  },
  {
    id: "hero-with-swatches",
    title: "Hero + paleta",
    description: "Imagen principal y muestras de color.",
    previewColor: "#fee2e2",
    elements: [
      elImage("t3-main", 80, 90, 380, 230, "/images/hero-carpinteria-2.svg"),
      elText("t3-title", 100, 60, 260, 60, "Estilo Carpihogar"),
      elImage("t3-swatch1", 490, 120, 60, 60, "/logo-default.svg"),
      elImage("t3-swatch2", 560, 120, 60, 60, "/logo-default.svg"),
      elImage("t3-swatch3", 630, 120, 60, 60, "/logo-default.svg"),
    ],
  },
  {
    id: "before-after",
    title: "Antes / Después",
    description: "Comparativa de dos espacios.",
    previewColor: "#ecfeff",
    elements: [
      elText("t4-leftlabel", 90, 70, 120, 40, "Antes"),
      elText("t4-rightlabel", 420, 70, 120, 40, "Después"),
      elImage("t4-before", 60, 120, 260, 220, "/images/hero-carpinteria-1.svg"),
      elImage("t4-after", 360, 120, 260, 220, "/images/hero-carpinteria-3.svg"),
    ],
  },
  {
    id: "storyboard",
    title: "Storyboard",
    description: "Secuencia de 4 escenas con texto.",
    previewColor: "#e0f2fe",
    elements: [
      elImage("t5-1", 60, 90, 180, 120, "/logo-default.svg"),
      elImage("t5-2", 260, 90, 180, 120, "/logo-default.svg"),
      elImage("t5-3", 60, 230, 180, 120, "/logo-default.svg"),
      elImage("t5-4", 260, 230, 180, 120, "/logo-default.svg"),
      elText(
        "t5-caption",
        460,
        120,
        220,
        180,
        "Cuenta la historia del espacio:\ninspiración, materiales, iluminación y detalles."
      ),
    ],
  },
];

