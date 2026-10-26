'use client';

import { useEffect, useState, useTransition } from 'react';
import Modal from '@/app/ui/modal';
import type { MediaAsset } from '@/app/lib/media';
import { deleteMediaAction } from '@/app/lib/media-actions';

type PageResult = {
  items: MediaAsset[];
  nextCursor: string | null;
  hasMore: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  initialItems: MediaAsset[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  isAdmin?: boolean;
  onLoadPage: (cursor?: string | null) => Promise<PageResult>;
};

export default function AvatarLibraryModal({
  open,
  onClose,
  onSelect,
  initialItems,
  initialNextCursor,
  initialHasMore,
  isAdmin = false,
  onLoadPage,
}: Props) {
  const [items, setItems] = useState<MediaAsset[]>(initialItems);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Cursor stack so "Previous" works with Blob cursors
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);

  useEffect(() => {
    if (!open) return;
    setItems(initialItems);
    setNextCursor(initialNextCursor);
    setHasMore(initialHasMore);
    setCursorStack([null]);
    setSelected(null);
    setMessage(null);
  }, [open, initialItems, initialNextCursor, initialHasMore]);

  function loadWithCursor(cursor: string | null, direction: 'next' | 'prev' | 'reset') {
    startTransition(async () => {
      try {
        const res = await onLoadPage(cursor);
        setItems(res.items);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
        setSelected(null);
        setMessage(null);

        if (direction === 'next') {
          setCursorStack((s) => [...s, cursor]);
        } else if (direction === 'prev') {
          setCursorStack((s) => s.slice(0, -1));
        } else {
          setCursorStack([null]);
        }
      } catch {
        setMessage('Failed to load avatars. Check BLOB_READ_WRITE_TOKEN.');
      }
    });
  }

  function handleNext() {
    if (!hasMore || !nextCursor) return;
    // Request the next page using current nextCursor
    loadWithCursor(nextCursor, 'next');
  }

  function handlePrev() {
    if (cursorStack.length <= 1) return;
    const prevCursor = cursorStack[cursorStack.length - 2] ?? null;
    loadWithCursor(prevCursor, 'prev');
  }

  function handleDelete(url: string) {
    startTransition(async () => {
      const res = await deleteMediaAction(url);
      if (!res.ok) {
        setMessage(res.message);
        return;
      }
      // Reload current page cursor (top of stack)
      const currentCursor = cursorStack[cursorStack.length - 1] ?? null;
      const resPage = await onLoadPage(currentCursor);
      setItems(resPage.items);
      setNextCursor(resPage.nextCursor);
      setHasMore(resPage.hasMore);
      if (selected === url) setSelected(null);
      setMessage(null);
    });
  }

  const canPrev = cursorStack.length > 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Choose avatar"
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
            disabled={!selected || pending}
            onClick={() => selected && onSelect(selected)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Use selected
          </button>
        </>
      }
    >
      {message && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {message}
        </p>
      )}

      <div className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
        {items.map((asset) => (
          <div key={asset.id} className="relative">
            <button
              type="button"
              disabled={pending}
              onClick={() => setSelected(asset.url)}
              className={`w-full rounded-lg border p-2 ${
                selected === asset.url
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <img
                src={asset.url}
                alt="Avatar"
                className="mx-auto h-14 w-14 rounded-full object-cover"
              />
              {/* <p className="mt-1 truncate text-[10px] text-gray-500">
                {asset.filename}
              </p> */}
            </button>

            {isAdmin && (
              <button
                type="button"
                title="Delete from Blob"
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(asset.url);
                }}
                className="absolute right-1 top-1 rounded bg-white/95 px-1.5 text-xs text-red-600 shadow hover:bg-red-50"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-gray-500">
            No uploaded avatars in Blob yet. Use &quot;Upload new&quot; first.
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={!canPrev || pending}
          onClick={handlePrev}
          className="rounded border border-gray-200 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-gray-500">
          {pending ? 'Loading…' : hasMore ? 'More available' : 'End of list'}
        </span>
        <button
          type="button"
          disabled={!hasMore || pending}
          onClick={handleNext}
          className="rounded border border-gray-200 px-3 py-1 hover:bg-gray-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </Modal>
  );
}
// 'use client';

// import {useEffect,useState,useTransition }from 'react';
// import Modal from '@/app/ui/modal';
// import type {MediaAsset }from '@/app/lib/media';
// import {deleteMediaAction }from '@/app/lib/media-actions';

// type Props = {
//   open: boolean;
//   onClose: ()=> void;
//   onSelect: (url: string)=> void;
//   /** first page from server */
//   initialItems: MediaAsset[];
//   initialTotalPages: number;
//   folders: string[];
//   isAdmin?: boolean;
//   /** load page from server action or route handler */
//   onLoadPage: (args: {
//     query: string;
//     folder: string;
//     page: number;
//   })=> Promise<{items: MediaAsset[];totalPages: number }>;
// };

// export default function AvatarLibraryModal({
//   open,
//   onClose,
//   onSelect,
//   initialItems,
//   initialTotalPages,
//   folders,
//   isAdmin = false,
//   onLoadPage,
// }: Props) {
//   const [items,setItems]= useState(initialItems);
//   const [page,setPage]= useState(1);
//   const [totalPages,setTotalPages]= useState(initialTotalPages);
//   const [query,setQuery]= useState('');
//   const [folder,setFolder]= useState('');
//   const [selected,setSelected]= useState<string | null>(null);
//   const [pending,startTransition]= useTransition();
//   const [message,setMessage]= useState<string | null>(null);

//   useEffect(()=> {
//     if (!open)return;
//     setItems(initialItems);
//     setTotalPages(initialTotalPages);
//     setPage(1);
//     setSelected(null);
//     setMessage(null);
//   }, [open,initialItems,initialTotalPages]);

//   function reload(next: {query?: string;folder?: string;page?: number }) {
//     const q = next.query ?? query;
//     const f = next.folder ?? folder;
//     const p = next.page ?? page;

//     startTransition(async ()=> {
//       const res = await onLoadPage({ query:q, folder:f, page:p });
//       setItems(res.items);
//       setTotalPages(res.totalPages);
//       setPage(p);
//     });
//   }

//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title="Media library"
//       footer={
//         <>
//           <button
//             type="button"
//             onClick={onClose}
//             className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
//           >
//             Cancel
//           </button>
//           <button
//             type="button"
//             disabled={!selected}
//             onClick={()=> selected && onSelect(selected)}
//             className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
//           >
//             Use selected
//           </button>
//         </>
//       }
//     >
//       <div className="mb-3 flex flex-col gap-2 sm:flex-row">
//         <input
//           type="search"
//           placeholder="Search filename…"
//           value={query}
//           onChange={(e)=> setQuery(e.target.value)}
//           onKeyDown={(e)=> {
//             if (e.key === 'Enter') {
//               e.preventDefault();
//               reload({query, page:1 });
//             }
//           }}
//           className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
//         />
//         <select
//           value={folder}
//           onChange={(e)=> {
//             const f = e.target.value;
//             setFolder(f);
//             reload({ folder:f, page:1 });
//           }}
//           className="rounded-md border border-gray-200 px-3 py-2 text-sm"
//         >
//           <option value="">All folders</option>
//           {folders.map((f)=> (
//             <option key={f}value={f}>
//               {f}
//             </option>
//           ))}
//         </select>
//         <button
//           type="button"
//           onClick={()=> reload({query,folder, page:1 })}
//           className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
//         >
//           Search
//         </button>
//       </div>

//       {message && <p className="mb-2 text-sm text-red-600">{message}</p>}

//       <div className="grid max-h-80 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
//         {items.map((asset)=> (
//           <div key={asset.id}className="relative">
//             <button
//               type="button"
//               onClick={()=> setSelected(asset.url)}
//               className={`w-full rounded-lg border p-1 ${
//                 selected === asset.url
//                   ? 'border-blue-500 ring-2 ring-blue-200'
//                   : 'border-gray-200'
//               }`}
//             >
//               <img
//                 src={asset.url}
//                 alt={asset.filename}
//                 className="mx-auto h-16 w-16 rounded-full object-cover"
//               />
//               <p className="mt-1 truncate text-[10px] text-gray-500">
//                 {asset.filename}
//               </p>
//             </button>

//             {isAdmin && !asset.in_use && (
//               <button
//                 type="button"
//                 title="Delete unused"
//                 className="absolute right-1 top-1 rounded bg-white/90 px-1 text-xs text-red-600 shadow"
//                 onClick={()=> {
//                   startTransition(async ()=> {
//                     const res = await deleteMediaAction(asset.id);
//                     if (!res.ok)setMessage(res.message);
//                     else reload({page });
//                   });
//                 }}
//               >
//                 ×
//               </button>
//             )}
//           </div>
//         ))}
//         {items.length=== 0 && (
//           <p className="col-span-full py-8 text-center text-sm text-gray-500">
//             No media found.
//           </p>
//         )}
//       </div>

//       <div className="mt-3 flex items-center justify-between text-sm">
//         <button
//           type="button"
//           disabled={page <= 1 || pending}
//           onClick={()=> reload({ page:page - 1 })}
//           className="rounded border px-2 py-1 disabled:opacity-40"
//         >
//           Previous
//         </button>
//         <span className="text-gray-500">
//           Page {page} / {totalPages}
//         </span>
//         <button
//           type="button"
//           disabled={page >= totalPages || pending}
//           onClick={()=> reload({ page:page + 1 })}
//           className="rounded border px-2 py-1 disabled:opacity-40"
//         >
//           Next
//         </button>
//       </div>
//     </Modal>
//   );
// }