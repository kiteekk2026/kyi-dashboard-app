import {put }from '@vercel/blob';
import {randomUUID }from 'crypto';

export async function uploadCustomerAvatar(file: File): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image must be smaller than 2 MB');
  }

  const ext = file.name.split('.').pop()?.toLowerCase()|| 'png';
  const safeExt = ['png','jpg','jpeg','webp','gif'].includes(ext)
    ? ext
    : 'png';
    const shortId = randomUUID().replace(/-/g, "").slice(0, 10);
  const filename = `customers/${shortId}.${safeExt}`;

  const blob = await put(filename,file, {
    access:'public',
    token:process.env.BLOB_READ_WRITE_TOKEN,
    // optional: contentType: file.type,
  });

  // Permanent public URL, works in local and production
  return blob.url;
}