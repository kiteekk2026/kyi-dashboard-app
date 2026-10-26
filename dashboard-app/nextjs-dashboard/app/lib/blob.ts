import { put, del, list } from '@vercel/blob';
import { randomUUID } from 'crypto';

function getToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }
  return token;
}

export async function uploadCustomerAvatar(file: File): Promise<string> {
  const token = getToken();

  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image must be smaller than 2 MB');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)
    ? ext
    : 'png';
  const pathname = `customers/${randomUUID()}.${safeExt}`;

  const blob = await put(pathname, file, {
    access: 'public',
    token,
    contentType: file.type,
  });

  return blob.url;
}

export async function deleteBlobByUrl(url: string) {
  if (!url.includes('blob.vercel-storage.com')) return;
  await del(url, { token: getToken() });
}

export async function listCustomerBlobs(options?: {
  cursor?: string | null;
  limit?: number;
}) {
  const token = getToken();
  const limit = options?.limit ?? 12;

  const result = await list({
    prefix: 'customers/',
    limit,
    cursor: options?.cursor || undefined,
    token,
  });

  const imageBlobs = result.blobs.filter((b) =>
    /\.(png|jpe?g|webp|gif)$/i.test(b.pathname),
  );

  return {
    blobs: imageBlobs,
    cursor: result.cursor as string | undefined,
    hasMore: Boolean(result.hasMore),
  };
}

// // import {put }from '@vercel/blob';
// // import {randomUUID }from 'crypto';

// // export async function uploadCustomerAvatar(file: File): Promise<string> {
// //   if (!process.env.BLOB_READ_WRITE_TOKEN) {
// //     throw new Error('BLOB_READ_WRITE_TOKEN is not set');
// //   }

// //   if (!file.type.startsWith('image/')) {
// //     throw new Error('Only image files are allowed');
// //   }

// //   if (file.size > 2 * 1024 * 1024) {
// //     throw new Error('Image must be smaller than 2 MB');
// //   }

// //   const ext = file.name.split('.').pop()?.toLowerCase()|| 'png';
// //   const safeExt = ['png','jpg','jpeg','webp','gif'].includes(ext)
// //     ? ext
// //     : 'png';
// //     const shortId = randomUUID().replace(/-/g, "").slice(0, 10);
// //   const filename = `customers/${shortId}.${safeExt}`;

// //   const blob = await put(filename,file, {
// //     access:'public',
// //     token:process.env.BLOB_READ_WRITE_TOKEN,
// //     // optional: contentType: file.type,
// //   });

// //   // Permanent public URL, works in local and production
// //   return blob.url;
// // }

// import {put,del,list }from '@vercel/blob';
// import {randomUUID }from 'crypto';
// import postgres from 'postgres';

// const sql = postgres(process.env.POSTGRES_URL!, { ssl:'require' });

// export async function uploadCustomerAvatar(
//   file: File,
//   options?: {folder?: string;uploadedBy?: string | null },
// ): Promise<{url: string;pathname: string }> {
//   if (!process.env.BLOB_READ_WRITE_TOKEN) {
//     throw new Error('BLOB_READ_WRITE_TOKEN is not set');
//   }
//   if (!file.type.startsWith('image/')) {
//     throw new Error('Only image files are allowed');
//   }
//   if (file.size > 2 * 1024 * 1024) {
//     throw new Error('Image must be smaller than 2 MB');
//   }

//   const folder = options?.folder ?? 'customers';
//   const ext = file.name.split('.').pop()?.toLowerCase()|| 'png';
//   const safeExt = ['png','jpg','jpeg','webp','gif'].includes(ext)? ext : 'png';
//   const filename = `${randomUUID()}.${safeExt}`;
//   const pathname = `${folder}/${filename}`;

//   const blob = await put(pathname,file, {
//     access:'public',
//     token:process.env.BLOB_READ_WRITE_TOKEN,
//     contentType:file.type,
//   });

//   await sql`
//     INSERT INTO media_assets (url, pathname, filename, folder, content_type, size_bytes, uploaded_by)
//     VALUES (
//       ${blob.url},
//       ${pathname},
//       ${file.name},
//       ${folder},
//       ${file.type},
//       ${file.size},
//       ${options?.uploadedBy ?? null}
//     )
//     ON CONFLICT (url) DO NOTHING
//   `;

//   return { url:blob.url,pathname };
// }

// export async function deleteBlobByUrl(url: string) {
//   if (!process.env.BLOB_READ_WRITE_TOKEN)return;
//   if (!url.includes('blob.vercel-storage.com'))return;
//   await del(url, { token:process.env.BLOB_READ_WRITE_TOKEN });
// }