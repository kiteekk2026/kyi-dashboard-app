'use server';

import { revalidatePath } from 'next/cache';
import { listMediaAssets, deleteMediaById } from '@/app/lib/media';

/**
 * Load a page from Blob.
 * Pass cursor from the previous response (null/undefined = first page).
 */
export async function loadMediaPageAction(cursor?: string | null) {
  const result = await listMediaAssets({
    cursor: cursor || null,
    limit: 12,
  });

  return {
    items: result.items,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  };
}

/**
 * Delete a Blob avatar by public URL.
 * Wire admin checks when RBAC is ready.
 */
export async function deleteMediaAction(url: string) {
  // await requirePermission('admin:rbac');

  const result = await deleteMediaById(url);

  if (result.ok) {
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/admin/media');
  }

  return result;
}
// 'use server';

// import {revalidatePath }from 'next/cache';
// import {deleteUnusedMediaAsset }from '@/app/lib/media';
// import {listMediaAssets }from '@/app/lib/media';
// // import { requirePermission } from '@/app/lib/rbac'; // when RBAC is ready

// export async function deleteMediaAction(id: string) {
//   // await requirePermission('admin:rbac'); // or admin-only check
//   const result = await deleteUnusedMediaAsset(id);
//   revalidatePath('/dashboard','layout');
//   revalidatePath('/admin/media');
//   return result;
// }

// export async function loadMediaPageAction(args: {
//     query: string;
//     folder: string;
//     page: number;
//   }) {
//     // optional: require login
//     const result = await listMediaAssets({
//       query:args.query,
//       folder:args.folder || undefined,
//       page:args.page,
//     });
//     return {
//       items:result.items,
//       totalPages:result.totalPages,
//     };
//   }