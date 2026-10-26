// app/lib/avatars.server.ts
import 'server-only'; // npm i server-only

import { readdir } from 'fs/promises';
import path from 'path';
import { list } from '@vercel/blob';
import { PRESET_AVATARS } from '@/app/lib/avatars';

function isImageFile(name: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}

export async function getAvatarsFromPublicDir(): Promise<string[]> {
  const dir = path.join(process.cwd(), 'public', 'customers');
  try {
    const files = await readdir(dir);
    return files.filter(isImageFile).map((f) => `/customers/${f}`).sort();
  } catch {
    return [];
  }
}

export async function getAvatarsFromBlob(): Promise<string[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const { blobs } = await list({
      prefix: 'customers/',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blobs
      .filter((b) => isImageFile(b.pathname))
      .map((b) => b.url)
      .sort();
  } catch {
    return [];
  }
}

/** Optional admin/debug helper — not for the customer form */
export async function getExistingAvatars(): Promise<string[]> {
  const [fromDisk, fromBlob] = await Promise.all([
    getAvatarsFromPublicDir(),
    getAvatarsFromBlob(),
  ]);
  return [...new Set([...PRESET_AVATARS, ...fromDisk, ...fromBlob])].sort();
}