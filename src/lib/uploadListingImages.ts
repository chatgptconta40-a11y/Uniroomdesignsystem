import { projectId, publicAnonKey } from '/utils/supabase/info';
import { compressToWebP, validateImageFile } from './imageCompressor';

export const MAX_PROPERTY_IMAGES = 8;
export const MAX_ROOM_IMAGES = 6;

const SERVER = `https://${projectId}.supabase.co/functions/v1/make-server-08c694dc`;

async function getAccessToken(): Promise<string> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? publicAnonKey;
  } catch {
    return publicAnonKey;
  }
}

export interface UploadImageOptions {
  type: 'property' | 'room';
  landlordId: string;
  propertyId: string;
  roomId?: string;
}

/**
 * Validates, compresses to WebP, and uploads a single image file via the
 * server proxy to Supabase Storage. Returns the public URL.
 */
export async function uploadSingleImage(
  file: File,
  opts: UploadImageOptions,
  accessToken?: string,
): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const compressed = await compressToWebP(file);
  const token = accessToken ?? (await getAccessToken());

  const form = new FormData();
  form.append('file', compressed, 'image.webp');
  form.append('type', opts.type);
  form.append('landlordId', opts.landlordId);
  form.append('propertyId', opts.propertyId);
  if (opts.roomId) form.append('roomId', opts.roomId);

  const res = await fetch(`${SERVER}/images/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Falha no upload da imagem.');
  return data.url as string;
}

/**
 * Legacy pass-through kept so old callers don't break.
 * blob:/data: URLs should have been uploaded eagerly before reaching this point.
 * They are silently dropped; only https:// URLs pass through.
 */
export async function uploadImages(
  urls: string[],
  _folder: string,
): Promise<string[]> {
  return urls.filter(u => u.startsWith('https://'));
}

/**
 * Asks the server to delete all storage files for a given property or room.
 */
export async function deleteStorageFolder(
  opts: UploadImageOptions,
  accessToken?: string,
): Promise<void> {
  const token = accessToken ?? (await getAccessToken());
  await fetch(`${SERVER}/images/cleanup`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
}
