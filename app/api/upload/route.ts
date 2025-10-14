import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

// Note: The default body size limit for Next.js API routes is 4MB.
// To handle larger files, especially videos, consider using a third-party storage service like Vercel Blob.
// This would involve streaming the upload directly to the blob storage provider.

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

function darken(hex: string, factor = 0.7): string | undefined {
  const rgb = hexToRgb(hex);
  if (!rgb) return undefined;
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const form = await req.formData();
    const file: any = form.get('file');
    const fileType = (form.get('type') as string) || (String((form.get('file') as any)?.type || '').startsWith('video/') ? 'video' : 'image');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const mime = file.type || 'application/octet-stream';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', year, month);
    await fs.mkdir(uploadsDir, { recursive: true });

    const nameGuess = (file as any).name ? String((file as any).name).toLowerCase() : '';
    let ext = nameGuess.match(/\.([a-z0-9]+)$/)?.[1] || '';
    if (!ext) ext = (mime && mime.includes('/')) ? mime.split('/')[1] : 'bin';
    const filename = `${randomUUID()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    const urlPath = `/uploads/${year}/${month}/${filename}`;

    if (fileType === 'image') {
        // Color detection (best-effort). If the file is not an image, sharp will fail and we ignore.
        let dominant: string | undefined = undefined;
        let secondary: string | undefined = undefined;
        try {
          const { data } = await sharp(filePath)
            .resize(1, 1, { fit: 'cover' })
            .toColourspace('srgb')
            .raw()
            .toBuffer({ resolveWithObject: true }) as any;
          const r = data[0];
          const g = data[1];
          const b = data[2];
          const hex = '#' + [r, g, b].map((x: number) => x.toString(16).padStart(2, '0')).join('');
          dominant = hex;
          secondary = darken(hex, 0.6);
        } catch {}
        return NextResponse.json({ url: urlPath, name: filename, dominant, secondary });
    } else {
        return NextResponse.json({ url: urlPath, name: filename });
    }

  } catch (err) {
    console.error('Upload error', err);
    const msg = String((err as any)?.message || '').toLowerCase();
    if (msg.includes('input file contains unsupported image format')) {
      return NextResponse.json({ error: 'Formato de archivo no soportado por el procesador de imagenes' }, { status: 415 });
    }
    if ((err as any).type === 'entity.too.large') {
      return NextResponse.json({ error: 'El archivo es demasiado grande para el servidor. Considera subir un video mas ligero o usar almacenamiento externo.' }, { status: 413 });
    }
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
