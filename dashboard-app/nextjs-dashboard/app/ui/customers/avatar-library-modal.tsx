'use client';

import {useEffect,useState,useTransition }from 'react';
import Modal from '@/app/ui/modal';
import type {MediaAsset }from '@/app/lib/media';
import {deleteMediaAction }from '@/app/lib/media-actions';

type Props = {
  open: boolean;
  onClose: ()=> void;
  onSelect: (url: string)=> void;
  /** first page from server */
  initialItems: MediaAsset[];
  initialTotalPages: number;
  folders: string[];
  isAdmin?: boolean;
  /** load page from server action or route handler */
  onLoadPage: (args: {
    query: string;
    folder: string;
    page: number;
  })=> Promise<{items: MediaAsset[];totalPages: number }>;
};

export default function AvatarLibraryModal({
  open,
  onClose,
  onSelect,
  initialItems,
  initialTotalPages,
  folders,
  isAdmin = false,
  onLoadPage,
}: Props) {
  const [items,setItems]= useState(initialItems);
  const [page,setPage]= useState(1);
  const [totalPages,setTotalPages]= useState(initialTotalPages);
  const [query,setQuery]= useState('');
  const [folder,setFolder]= useState('');
  const [selected,setSelected]= useState<string | null>(null);
  const [pending,startTransition]= useTransition();
  const [message,setMessage]= useState<string | null>(null);

  useEffect(()=> {
    if (!open)return;
    setItems(initialItems);
    setTotalPages(initialTotalPages);
    setPage(1);
    setSelected(null);
    setMessage(null);
  }, [open,initialItems,initialTotalPages]);

  function reload(next: {query?: string;folder?: string;page?: number }) {
    const q = next.query ?? query;
    const f = next.folder ?? folder;
    const p = next.page ?? page;

    startTransition(async ()=> {
      const res = await onLoadPage({ query:q, folder:f, page:p });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setPage(p);
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Media library"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={()=> selected && onSelect(selected)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Use selected
          </button>
        </>
      }
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          placeholder="Search filename…"
          value={query}
          onChange={(e)=> setQuery(e.target.value)}
          onKeyDown={(e)=> {
            if (e.key === 'Enter') {
              e.preventDefault();
              reload({query, page:1 });
            }
          }}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          value={folder}
          onChange={(e)=> {
            const f = e.target.value;
            setFolder(f);
            reload({ folder:f, page:1 });
          }}
          className="rounded-md border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All folders</option>
          {folders.map((f)=> (
            <option key={f}value={f}>
              {f}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={()=> reload({query,folder, page:1 })}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
        >
          Search
        </button>
      </div>

      {message && <p className="mb-2 text-sm text-red-600">{message}</p>}

      <div className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
        {items.map((asset)=> (
          <div key={asset.id}className="relative">
            <button
              type="button"
              onClick={()=> setSelected(asset.url)}
              className={`w-full rounded-lg border p-1 ${
                selected === asset.url
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200'
              }`}
            >
              <img
                src={asset.url}
                alt={asset.filename}
                className="mx-auto h-16 w-16 rounded-full object-cover"
              />
              <p className="mt-1 truncate text-[10px] text-gray-500">
                {asset.filename}
              </p>
            </button>

            {isAdmin && !asset.in_use && (
              <button
                type="button"
                title="Delete unused"
                className="absolute right-1 top-1 rounded bg-white/90 px-1 text-xs text-red-600 shadow"
                onClick={()=> {
                  startTransition(async ()=> {
                    const res = await deleteMediaAction(asset.id);
                    if (!res.ok)setMessage(res.message);
                    else reload({page });
                  });
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {items.length=== 0 && (
          <p className="col-span-full py-8 text-center text-sm text-gray-500">
            No media found.
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={page <= 1 || pending}
          onClick={()=> reload({ page:page - 1 })}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-gray-500">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || pending}
          onClick={()=> reload({ page:page + 1 })}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </Modal>
  );
}