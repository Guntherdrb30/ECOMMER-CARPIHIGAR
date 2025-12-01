export type MoodboardElementType = 'product' | 'image' | 'text';

export interface MoodboardElement {
  id: string;
  type: MoodboardElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  data: {
    productId?: string;
    imageUrl?: string;
    textContent?: string;
    quantity?: number;
    code?: string;
    name?: string;
    price?: number;
  };
}

export interface Moodboard {
  id: string;
  title: string;
  userId: string;
  thumbnailUrl?: string;
  elements: MoodboardElement[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  code: string;
  price: number;
  imageUrl: string;
  category?: string;
}

export interface SaveMoodboardPayload {
  id?: string;
  title: string;
  elements: MoodboardElement[];
  thumbnailDataUrl?: string | null;
}
