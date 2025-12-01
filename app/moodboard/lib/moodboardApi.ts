import { Moodboard, ProductSummary, SaveMoodboardPayload } from '@/app/moodboard/lib/moodboardTypes';

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error || data?.message) {
        msg = String(data.error || data.message);
      }
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export async function fetchMoodboardProducts(params: {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
} = {}): Promise<ProductSummary[]> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set('q', params.q);
  if (params.category) searchParams.set('category', params.category);
  if (typeof params.minPrice === 'number') searchParams.set('minPrice', String(params.minPrice));
  if (typeof params.maxPrice === 'number') searchParams.set('maxPrice', String(params.maxPrice));

  const res = await fetch(`/api/moodboard/products?${searchParams.toString()}`, {
    method: 'GET',
  });
  return handleJson<ProductSummary[]>(res);
}

export async function listMoodboards(): Promise<Moodboard[]> {
  const res = await fetch('/api/moodboard/list', { method: 'GET' });
  return handleJson<Moodboard[]>(res);
}

export async function saveMoodboard(payload: SaveMoodboardPayload): Promise<Moodboard> {
  const res = await fetch('/api/moodboard/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson<Moodboard>(res);
}

export async function deleteMoodboard(id: string): Promise<void> {
  const res = await fetch(`/api/moodboard/delete?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 404) {
    await handleJson(res); // throws with message
  }
}

export async function uploadMoodboardThumbnail(moodboardId: string, dataUrl: string): Promise<void> {
  const res = await fetch('/api/moodboard/thumbnail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moodboardId, dataUrl }),
  });
  if (!res.ok) {
    await handleJson(res);
  }
}

