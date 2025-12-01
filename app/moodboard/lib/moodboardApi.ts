import { Moodboard, ProductSummary, SaveMoodboardPayload } from '@/app/moodboard/lib/moodboardTypes';

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    let body: any = null;
    try {
      body = await res.json();
      if (body?.error || body?.message) {
        msg = String(body.error || body.message);
      }
    } catch {
      // ignore parse errors
    }

    if (typeof window !== 'undefined' && res.status === 401) {
      // Avisamos al usuario y lo redirigimos a login con callback
      try {
        // eslint-disable-next-line no-alert
        alert(msg || 'Debes iniciar sesion para continuar.');
      } catch {
        // ignore
      }
      const current =
        window.location.pathname + (window.location.search || '') || '/moodboard';
      const callback = encodeURIComponent(current);
      const messageParam = encodeURIComponent(
        msg || 'Debes iniciar sesion para continuar.',
      );
      window.location.href = `/auth/login?callbackUrl=${callback}&message=${messageParam}`;
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

export async function publishMoodboardNews(payload: {
  imageDataUrl: string;
  title?: string;
  excerpt?: string;
}): Promise<{ ok: boolean; id?: string }> {
  const res = await fetch('/api/moodboard/publish-news', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleJson<{ ok: boolean; id?: string }>(res);
}
