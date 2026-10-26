import { listCustomerBlobs, deleteBlobByUrl } from '@/app/lib/blob';

export type MediaAsset = {
  id: string;
  url: string;
  pathname: string;
  filename: string;
  folder: string;
  /** Always false for Blob-only (no SQL usage check) */
  in_use?: boolean;
};

export type MediaListResult = {
  items: MediaAsset[];
  /** Cursor for the next page (Blob pagination) */
  nextCursor: string | null;
  hasMore: boolean;
};

function blobToAsset(b: {
  url: string;
  pathname: string;
}): MediaAsset {
  const filename = b.pathname.split('/').pop() || b.pathname;
  return {
    id: b.pathname, // stable id for React keys / delete
    url: b.url,
    pathname: b.pathname,
    filename,
    folder: 'customers',
    in_use: false,
  };
}

/**
 * List customer avatars from Vercel Blob only (no SQL).
 * Uses cursor-based pagination (how Blob works).
 */
export async function listMediaAssets(options?: {
  cursor?: string | null;
  limit?: number;
}): Promise<MediaListResult> {
  try {
    const { blobs, cursor, hasMore } = await listCustomerBlobs({
      cursor: options?.cursor,
      limit: options?.limit ?? 12,
    });

    return {
      items: blobs.map(blobToAsset),
      nextCursor: cursor ?? null,
      hasMore,
    };
  } catch (error) {
    console.error('listMediaAssets error:', error);
    return {
      items: [],
      nextCursor: null,
      hasMore: false,
    };
  }
}

/**
 * First page helper for Server Components (create/edit pages).
 */
export async function listMediaAssetsFirstPage(limit = 12) {
  return listMediaAssets({ cursor: null, limit });
}

/**
 * Delete by pathname or url from Blob.
 * Note: without SQL we cannot know if a customer still uses this URL.
 * Prefer admin-only + confirm in UI.
 */
export async function deleteMediaById(pathnameOrUrl: string): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    // If id is pathname like "customers/uuid.png", resolve URL via list is heavy;
    // modal should pass full blob URL when deleting.
    if (!pathnameOrUrl.includes('blob.vercel-storage.com')) {
      return {
        ok: false,
        message: 'Only Blob URLs can be deleted.',
      };
    }

    await deleteBlobByUrl(pathnameOrUrl);
    return { ok: true, message: 'Deleted.' };
  } catch (error) {
    console.error('deleteMediaById error:', error);
    return { ok: false, message: 'Failed to delete media.' };
  }
}

/** Kept for compatibility if something still imports it — always empty without SQL */
export async function listMediaFolders(): Promise<string[]> {
  return ['customers'];
}

// import {deleteBlobByUrl }from '@/app/lib/blob';
// import sql from '@/app/lib/db'

// // const sql = postgres(process.env.POSTGRES_URL!, { ssl:'require' });

// export type MediaAsset = {
//     id: string;
//     url: string;
//     pathname: string;
//     filename: string;
//     folder: string;
//     content_type: string | null;
//     size_bytes: number | null;
//     created_at: string;          // or Date if you prefer
//     in_use: boolean;
//   };
  
//   const PAGE_SIZE = 24;
  
//   export async function listMediaAssets(options: {
//     query?: string;
//     folder?: string;
//     page?: number;
//   }): Promise<{ items: MediaAsset[]; totalPages: number; total: number }> {
//     const page = Math.max(1, options.page ?? 1);
//     const offset = (page - 1) * PAGE_SIZE;
//     const q = options.query?.trim() ?? '';
//     const folder = options.folder?.trim() || null;
  
//     const [countRows, rows] = await Promise.all([
//       sql<{ count: number }[]>`
//         SELECT COUNT(*)::int AS count
//         FROM media_assets m
//         WHERE
//           (${q} = '' OR m.filename ILIKE ${'%' + q + '%'} OR m.pathname ILIKE ${'%' + q + '%'})
//           AND (${folder}::text IS NULL OR m.folder = ${folder})
//       `,
//       sql<MediaAsset[]>`
//         SELECT
//           m.id,
//           m.url,
//           m.pathname,
//           m.filename,
//           m.folder,
//           m.content_type,
//           m.size_bytes,
//           m.created_at,
//           EXISTS (
//             SELECT 1 FROM customers c WHERE c.image_url = m.url
//           ) AS in_use
//         FROM media_assets m
//         WHERE
//           (${q} = '' OR m.filename ILIKE ${'%' + q + '%'} OR m.pathname ILIKE ${'%' + q + '%'})
//           AND (${folder}::text IS NULL OR m.folder = ${folder})
//         ORDER BY m.created_at DESC
//         LIMIT ${PAGE_SIZE} OFFSET ${offset}
//       `,
//     ]);
  
//     const total = countRows[0]?.count ?? 0;
  
//     return {
//       items: rows,
//       total,
//       totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
//     };
//   }

// export async function listMediaFolders(): Promise<string[]> {
//   const rows = await sql<{folder: string }[]>`
//     SELECT DISTINCT folder FROM media_assets ORDER BY folder ASC
//   `;
//   return rows.map((r)=> r.folder);
// }

// /** Admin: delete asset if not used by any customer */
// export async function deleteUnusedMediaAsset(id: string): Promise<{ok: boolean;message: string }> {
//   const rows = await sql`
//     SELECT m.url,
//       EXISTS (SELECT 1 FROM customers c WHERE c.image_url = m.url) AS in_use
//     FROM media_assets m
//     WHERE m.id = ${id}
//   `;

//   if (!rows[0]) {
//     return { ok:false, message:'Asset not found.' };
//   }
//   if (rows[0].in_use) {
//     return { ok:false, message:'Asset is in use by a customer and cannot be deleted.' };
//   }

//   const url = rows[0].url as string;
//   try {
//     await deleteBlobByUrl(url);
//   }catch (e) {
//     console.error(e);
//     // still remove DB row if blob already gone
//   }

//   await sql`DELETE FROM media_assets WHERE id = ${id}`;
//   return { ok:true, message:'Deleted.' };
// }