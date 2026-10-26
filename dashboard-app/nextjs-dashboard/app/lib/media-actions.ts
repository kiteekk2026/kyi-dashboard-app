'use server';

import {revalidatePath }from 'next/cache';
import {deleteUnusedMediaAsset }from '@/app/lib/media';
import {listMediaAssets }from '@/app/lib/media';
// import { requirePermission } from '@/app/lib/rbac'; // when RBAC is ready

export async function deleteMediaAction(id: string) {
  // await requirePermission('admin:rbac'); // or admin-only check
  const result = await deleteUnusedMediaAsset(id);
  revalidatePath('/dashboard','layout');
  revalidatePath('/admin/media');
  return result;
}

export async function loadMediaPageAction(args: {
    query: string;
    folder: string;
    page: number;
  }) {
    // optional: require login
    const result = await listMediaAssets({
      query:args.query,
      folder:args.folder || undefined,
      page:args.page,
    });
    return {
      items:result.items,
      totalPages:result.totalPages,
    };
  }