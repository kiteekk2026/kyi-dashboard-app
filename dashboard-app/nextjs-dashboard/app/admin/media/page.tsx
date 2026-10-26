import { listMediaAssets } from '@/app/lib/media';
import MediaAdminClient from '@/app/ui/admin/media-admin-client';
import { Metadata } from 'next';
// import { userHasPermission } from '@/app/lib/rbac';
// import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Media library',
};

export default async function MediaPage() {
  // if (!(await userHasPermission('admin:rbac'))) {
  //   redirect('/dashboard');
  // }

  const media = await listMediaAssets({ cursor: null, limit: 24 });

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">Media library</h1>
      <p className="mb-6 text-sm text-gray-500">
        Uploaded avatars stored in Vercel Blob (folder <code>customers/</code>).
      </p>

      <MediaAdminClient
        initialItems={media.items}
        initialNextCursor={media.nextCursor}
        initialHasMore={media.hasMore}
      />
    </main>
  );
}