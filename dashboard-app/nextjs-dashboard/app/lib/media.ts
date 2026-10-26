import {deleteBlobByUrl }from '@/app/lib/blob';
import sql from '@/app/lib/db'

// const sql = postgres(process.env.POSTGRES_URL!, { ssl:'require' });

export type MediaAsset = {
    id: string;
    url: string;
    pathname: string;
    filename: string;
    folder: string;
    content_type: string | null;
    size_bytes: number | null;
    created_at: string;          // or Date if you prefer
    in_use: boolean;
  };
  
  const PAGE_SIZE = 24;
  
  export async function listMediaAssets(options: {
    query?: string;
    folder?: string;
    page?: number;
  }): Promise<{ items: MediaAsset[]; totalPages: number; total: number }> {
    const page = Math.max(1, options.page ?? 1);
    const offset = (page - 1) * PAGE_SIZE;
    const q = options.query?.trim() ?? '';
    const folder = options.folder?.trim() || null;
  
    const [countRows, rows] = await Promise.all([
      sql<{ count: number }[]>`
        SELECT COUNT(*)::int AS count
        FROM media_assets m
        WHERE
          (${q} = '' OR m.filename ILIKE ${'%' + q + '%'} OR m.pathname ILIKE ${'%' + q + '%'})
          AND (${folder}::text IS NULL OR m.folder = ${folder})
      `,
      sql<MediaAsset[]>`
        SELECT
          m.id,
          m.url,
          m.pathname,
          m.filename,
          m.folder,
          m.content_type,
          m.size_bytes,
          m.created_at,
          EXISTS (
            SELECT 1 FROM customers c WHERE c.image_url = m.url
          ) AS in_use
        FROM media_assets m
        WHERE
          (${q} = '' OR m.filename ILIKE ${'%' + q + '%'} OR m.pathname ILIKE ${'%' + q + '%'})
          AND (${folder}::text IS NULL OR m.folder = ${folder})
        ORDER BY m.created_at DESC
        LIMIT ${PAGE_SIZE} OFFSET ${offset}
      `,
    ]);
  
    const total = countRows[0]?.count ?? 0;
  
    return {
      items: rows,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    };
  }

export async function listMediaFolders(): Promise<string[]> {
  const rows = await sql<{folder: string }[]>`
    SELECT DISTINCT folder FROM media_assets ORDER BY folder ASC
  `;
  return rows.map((r)=> r.folder);
}

/** Admin: delete asset if not used by any customer */
export async function deleteUnusedMediaAsset(id: string): Promise<{ok: boolean;message: string }> {
  const rows = await sql`
    SELECT m.url,
      EXISTS (SELECT 1 FROM customers c WHERE c.image_url = m.url) AS in_use
    FROM media_assets m
    WHERE m.id = ${id}
  `;

  if (!rows[0]) {
    return { ok:false, message:'Asset not found.' };
  }
  if (rows[0].in_use) {
    return { ok:false, message:'Asset is in use by a customer and cannot be deleted.' };
  }

  const url = rows[0].url as string;
  try {
    await deleteBlobByUrl(url);
  }catch (e) {
    console.error(e);
    // still remove DB row if blob already gone
  }

  await sql`DELETE FROM media_assets WHERE id = ${id}`;
  return { ok:true, message:'Deleted.' };
}