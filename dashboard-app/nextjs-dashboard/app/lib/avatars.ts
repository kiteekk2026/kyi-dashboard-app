import {readdir }from 'fs/promises';
import path from 'path';

/**
 * Reads every image file currently in public/customers/
 * and returns paths like "/customers/amy-burns.png"
 */
export async function getExistingAvatars(): Promise<string[]> {
  const dir = path.join(process.cwd(),'public','customers');

  try {
    const files = await readdir(dir);

    return files
      .filter((file)=> /\.(png|jpe?g|webp|gif)$/i.test(file))
      .map((file)=> `/customers/${file}`)
      .sort();
  }catch (error) {
    console.error('Failed to read avatars directory:',error);
    return [];
  }
}