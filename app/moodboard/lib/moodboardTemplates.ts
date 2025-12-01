import type { MoodboardElement } from "@/app/moodboard/lib/moodboardTypes";

export interface MoodboardTemplate {
  id: string;
  title: string;
  description: string;
  previewColor: string;
  elements: MoodboardElement[];
}

// Helpers
function elImage(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  imageUrl: string,
  backgroundColor?: string,
): MoodboardElement {
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
    data: { imageUrl, backgroundColor },
  };
}

function elText(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  options?: Partial<MoodboardElement["data"]>,
): MoodboardElement {
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
    data: {
      textContent: text,
      textColor: "#111827",
      fontFamily: "system",
      fontSize: 16,
      backgroundColor: "#FFFFFF",
      ...options,
    },
  };
}

export const MOODBOARD_TEMPLATES: MoodboardTemplate[] = [
  {
    id: "warm-bedroom",
    title: "Dormitorio cálido",
    description:
      "Composición para un dormitorio acogedor con fotos grandes, detalles y notas manuscritas.",
    previewColor: "#fef3c7",
    elements: [
      elText("t1-title", 90, 40, 260, 60, "Dormitorio Carpihogar", {
        fontFamily: "script",
        textColor: "#DC2626",
        fontSize: 24,
        backgroundColor: "#FEF3C7",
      }),
      elImage(
        "t1-main",
        80,
        100,
        340,
        220,
        "/images/hero-carpinteria-2.svg",
        "#FEE2E2",
      ),
      elImage(
        "t1-side",
        360,
        230,
        220,
        180,
        "/images/hero-carpinteria-3.svg",
        "#FEF3C7",
      ),
      elImage(
        "t1-detail",
        120,
        280,
        180,
        160,
        "/images/hero-carpinteria-1.svg",
        "#FFFBEB",
      ),
      elText(
        "t1-note",
        120,
        440,
        260,
        80,
        "Cuenta la historia del dormitorio:\n• Luz cálida\n• Tonos tierra\n• Texturas naturales",
        {
          fontFamily: "serif",
          fontSize: 14,
          backgroundColor: "#FFF7ED",
        },
      ),
    ],
  },
  {
    id: "catalog-grid",
    title: "Catálogo de productos",
    description:
      "Rejilla 2x3 ideal para comparar rápidamente productos de Carpihogar.",
    previewColor: "#e5e7eb",
    elements: [
      elText(
        "t2-title",
        60,
        40,
        380,
        40,
        "Opciones para tu proyecto",
        {
          fontFamily: "system",
          fontWeight: "bold",
          fontSize: 18,
          textAlign: "left",
          backgroundColor: "#F9FAFB",
        },
      ),
      elImage("t2-1", 60, 90, 180, 150, "/logo-default.svg", "#E5E7EB"),
      elImage("t2-2", 250, 90, 180, 150, "/logo-default.svg", "#E5E7EB"),
      elImage("t2-3", 440, 90, 180, 150, "/logo-default.svg", "#E5E7EB"),
      elImage("t2-4", 60, 250, 180, 150, "/logo-default.svg", "#E5E7EB"),
      elImage("t2-5", 250, 250, 180, 150, "/logo-default.svg", "#E5E7EB"),
      elImage("t2-6", 440, 250, 180, 150, "/logo-default.svg", "#E5E7EB"),
    ],
  },
  {
    id: "living-hero",
    title: "Sala principal + paleta",
    description:
      "Hero de sala con muestras de color para definir la paleta del proyecto.",
    previewColor: "#fee2e2",
    elements: [
      elText("t3-title", 90, 40, 260, 60, "Estilo Carpihogar", {
        fontFamily: "serif",
        fontSize: 22,
        textColor: "#B91C1C",
        backgroundColor: "#FEE2E2",
      }),
      elImage(
        "t3-main",
        80,
        100,
        380,
        230,
        "/images/hero-carpinteria-2.svg",
        "#FEE2E2",
      ),
      elImage("t3-swatch1", 490, 130, 60, 60, "/logo-default.svg", "#F97316"),
      elImage("t3-swatch2", 560, 130, 60, 60, "/logo-default.svg", "#FACC15"),
      elImage("t3-swatch3", 630, 130, 60, 60, "/logo-default.svg", "#F3F4F6"),
    ],
  },
  {
    id: "before-after",
    title: "Antes / Después reforma",
    description: "Comparativa visual del espacio antes y después de intervenirlo.",
    previewColor: "#ecfeff",
    elements: [
      elText("t4-leftlabel", 90, 70, 120, 40, "Antes", {
        backgroundColor: "#E0F2FE",
        textAlign: "center",
        fontWeight: "bold",
      }),
      elText("t4-rightlabel", 420, 70, 120, 40, "Después", {
        backgroundColor: "#ECFEFF",
        textAlign: "center",
        fontWeight: "bold",
      }),
      elImage(
        "t4-before",
        60,
        120,
        260,
        220,
        "/images/hero-carpinteria-1.svg",
        "#E0F2FE",
      ),
      elImage(
        "t4-after",
        360,
        120,
        260,
        220,
        "/images/hero-carpinteria-3.svg",
        "#ECFEFF",
      ),
    ],
  },
  {
    id: "project-storyboard",
    title: "Storyboard del proyecto",
    description:
      "Secuencia de 4 escenas para contar el proceso de diseño o recorrido del cliente.",
    previewColor: "#e0f2fe",
    elements: [
      elImage("t5-1", 60, 90, 180, 120, "/logo-default.svg", "#E0F2FE"),
      elImage("t5-2", 260, 90, 180, 120, "/logo-default.svg", "#E0F2FE"),
      elImage("t5-3", 60, 230, 180, 120, "/logo-default.svg", "#E0F2FE"),
      elImage("t5-4", 260, 230, 180, 120, "/logo-default.svg", "#E0F2FE"),
      elText(
        "t5-caption",
        460,
        120,
        220,
        180,
        "Cuenta la historia del espacio:\nInspiración, materiales, iluminación y detalles.",
        {
          fontFamily: "system",
          fontSize: 14,
          textAlign: "left",
          backgroundColor: "#EFF6FF",
        },
      ),
    ],
  },
];

