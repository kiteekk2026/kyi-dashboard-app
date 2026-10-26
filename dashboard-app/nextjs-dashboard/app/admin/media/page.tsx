import {redirect }from 'next/navigation';
import {listMediaAssets,listMediaFolders }from '@/app/lib/media';
// import { userHasPermission } from '@/app/lib/rbac';

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<{query?: string;folder?: string;page?: string }>;
}) {
  // if (!(await userHasPermission('admin:rbac'))) redirect('/dashboard');

  const sp = await searchParams;
  const page = Number(sp.page)|| 1;
  const [{items,totalPages,total },folders]= await Promise.all([
    listMediaAssets({
      query:sp.query,
      folder:sp.folder,
      page,
    }),
    listMediaFolders(),
  ]);

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Media library</h1>
      <p className="mb-4 text-sm text-gray-500">{total} assets</p>
      {/* Reuse table/grid + delete; or embed same modal list as page */}
    </main>
  );
}