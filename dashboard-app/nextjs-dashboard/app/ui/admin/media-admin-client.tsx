'use client';

import { useState, useTransition } from 'react';
import type { MediaAsset } from '@/app/lib/media';
import {
  loadMediaPageAction,
  deleteMediaAction,
} from '@/app/lib/media-actions';

type Props = {
  initialItems: MediaAsset[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
};

export default function MediaAdminClient({
  initialItems,
  initialNextCursor,
  initialHasMore,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load(cursor: string | null, direction: 'next' | 'prev' | 'reset') {
    startTransition(async () => {
      try {
        const res = await loadMediaPageAction(cursor);
        setItems(res.items);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setMessage(null);

        if (direction === 'next') {
          setCursorStack((s) => [...s, cursor]);
        } else if (direction === 'prev') {
          setCursorStack((s) => s.slice(0, -1));
        } else {
          setCursorStack([null]);
        }
      } catch {
        setMessage('Failed to load media. Check BLOB_READ_WRITE_TOKEN.');
      }
    });
  }

  function handleDelete(url: string) {
    if (!confirm('Delete this file from Blob storage?')) return;

    startTransition(async () => {
      const res = await deleteMediaAction(url);
      if (!res.ok) {
        setMessage(res.message);
        return;
      }
      const current = cursorStack[cursorStack.length - 1] ?? null;
      const page = await loadMediaPageAction(current);
      setItems(page.items);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
      setMessage('Deleted.');
    });
  }

  const canPrev = cursorStack.length > 1;

  return (
    <div>
      {message && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {message}
        </p>
      )}

      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
        {items.map((asset) => (
          <div
            key={asset.id}
            className="relative rounded-lg border border-gray-200 p-3"
          >
            <img
              src={asset.url}
              alt=""
              className="mx-auto h-16 w-16 rounded-full object-cover"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => handleDelete(asset.url)}
              className="mt-2 w-full rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">
          No uploaded avatars in Blob yet.
        </p>
      )}

      <div className="mt-6 flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={!canPrev || pending}
          onClick={() =>
            load(cursorStack[cursorStack.length - 2] ?? null, 'prev')
          }
          className="rounded border px-3 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-gray-500">
          {pending ? 'Loading…' : hasMore ? 'More available' : 'End of list'}
        </span>
        <button
          type="button"
          disabled={!hasMore || !nextCursor || pending}
          onClick={() => load(nextCursor, 'next')}
          className="rounded border px-3 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}