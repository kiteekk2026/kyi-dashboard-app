// import {readdir }from 'fs/promises';
// import path from 'path';

// /**
//  * Reads every image file currently in public/customers/
//  * and returns paths like "/customers/amy-burns.png"
//  */
// export async function getExistingAvatars(): Promise<string[]> {
//   const dir = path.join(process.cwd(),'public','customers');

//   try {
//     const files = await readdir(dir);

//     return files
//       .filter((file)=> /\.(png|jpe?g|webp|gif)$/i.test(file))
//       .map((file)=> `/customers/${file}`)
//       .sort();
//   }catch (error) {
//     console.error('Failed to read avatars directory:',error);
//     return [];
//   }
// }

// import {readdir }from 'fs/promises';
// import path from 'path';
// import {list }from '@vercel/blob';

/** Built-in avatars shipped in public/customers (always valid on local + Vercel CDN) */
/**
 * Client-safe avatar helpers.
 * Safe to import from Client Components (e.g. create-form / edit-form).
 * Do NOT import fs, path, or @vercel/blob in this file.
 */

export const PRESET_AVATARS = [
    '/customers/amy-burns.png',
    '/customers/balazs-orban.png',
    '/customers/delba-de-oliveira.png',
    '/customers/evil-rabbit.png',
    '/customers/lee-robinson.png',
    '/customers/michael-novotny.png',
  ] as const;
  
  export function getPresetAvatars(): string[] {
    return [...PRESET_AVATARS];
  }
  
  export function isPresetAvatar(url: string): boolean {
    return (PRESET_AVATARS as readonly string[]).includes(url);
  }
  
  export function isBlobAvatarUrl(url: string): boolean {
    return (
      url.startsWith('https://') &&
      url.includes('blob.vercel-storage.com') &&
      /\.(png|jpe?g|webp|gif)$/i.test(url)
    );
  }
  
  /**
   * Allowed on create/update:
   * - preset path (/customers/....png)
   * - Vercel Blob public URL
   * - other static /customers/... image paths
   */
  export function isAllowedAvatarUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    if (isPresetAvatar(url)) return true;
    if (isBlobAvatarUrl(url)) return true;
    if (url.startsWith('/customers/') && /\.(png|jpe?g|webp|gif)$/i.test(url)) {
      return true;
    }
    return false;
  }

/**
 * Safe check for create/update actions (local + Vercel).
 * Allows:
 * - /customers/.... preset or public paths
 * - https://...blob.vercel-storage.com/... uploads
 */
// export async function isAllowedAvatarUrl(url: string): Promise<boolean> {
//   if (!url || typeof url !== 'string')return false;

//   // Public preset / static path
//   if (url.startsWith('/customers/')&& isImageFile(url)) {
//     const known = await getExistingAvatars();
//     if (known.includes(url))return true;
//     // On Vercel, readdir may miss files that are still valid static assets
//     if (PRESET_AVATARS.includes(url as (typeof PRESET_AVATARS)[number])) {
//       return true;
//     }
//     // Allow any /customers/*.ext static path (deployed with the app)
//     return true;
//   }

//   // Vercel Blob public URL
//   if (
//     url.startsWith('https://')&&
//     url.includes('blob.vercel-storage.com')&&
//     isImageFile(url)
//   ) {
//     return true;
//   }

//   return false;
// }

 
   
//   export function isAllowedAvatarUrl(url: string): boolean {
//     if (!url)return false;
  
//     // Preset
//     if ((PRESET_AVATARS as readonly string[]).includes(url))return true;
  
//     // Blob upload
//     if (
//       url.startsWith('https://')&&
//       url.includes('blob.vercel-storage.com')&&
//       /\.(png|jpe?g|webp|gif)$/i.test(url)
//     ) {
//       return true;
//     }
  
//     // Any static /customers/... still on CDN
//     if (url.startsWith('/customers/')&& /\.(png|jpe?g|webp|gif)$/i.test(url)) {
//       return true;
//     }
  
//     return false;
//   }