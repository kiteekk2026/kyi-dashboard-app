'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserCircleIcon,
  AtSymbolIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createCustomer, type CustomerState } from '@/app/lib/actions';
import { PRESET_AVATARS } from '@/app/lib/avatars';
import AvatarLibraryModal from '@/app/ui/customers/avatar-library-modal';
import type { MediaAsset } from '@/app/lib/media';
import { loadMediaPageAction } from '@/app/lib/media-actions';

export default function CreateCustomerForm({
  libraryItems,
  libraryNextCursor,
  libraryHasMore,
  isAdmin = false,
}: {
  libraryItems: MediaAsset[];
  libraryNextCursor: string | null;
  libraryHasMore: boolean;
  isAdmin?: boolean;
}) {
  const initialState: CustomerState = { message: null, errors: {} };
  const [state, formAction, isPending] = useActionState(
    createCustomer,
    initialState,
  );

  const [mode, setMode] = useState<'preset' | 'upload' | 'library'>('preset');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryUrl, setLibraryUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <>
      <form action={formAction}>
        <div className="rounded-md bg-gray-50 p-4 md:p-6">
          {/* Name */}
          <div className="mb-4">
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Customer name
            </label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={state.values?.name ?? ''}
                placeholder="Enter customer name"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="name-error"
              />
              <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
            </div>
            <div id="name-error" aria-live="polite" aria-atomic="true">
              {state.errors?.name?.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={state.values?.email ?? ''}
                placeholder="Enter email address"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="email-error"
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
            </div>
            <div id="email-error" aria-live="polite" aria-atomic="true">
              {state.errors?.email?.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
            </div>
          </div>

          {/* Avatar */}
          <fieldset className="mb-4">
            <legend className="mb-2 block text-sm font-medium">Avatar</legend>

            <div className="mb-4 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              {(
                [
                  { id: 'preset' as const, label: 'Presets' },
                  { id: 'upload' as const, label: 'Upload new' },
                  { id: 'library' as const, label: 'From library' },
                ]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMode(tab.id);
                    if (tab.id === 'preset') {
                      setLibraryUrl(null);
                      setPreview(null);
                    }
                    if (tab.id === 'upload') {
                      setLibraryUrl(null);
                    }
                    if (tab.id === 'library') {
                      setPreview(null);
                      setLibraryOpen(true);
                    }
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    mode === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {mode === 'preset' && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {PRESET_AVATARS.map((src, i) => (
                  <label
                    key={src}
                    className="flex cursor-pointer flex-col items-center rounded-lg border border-gray-200 p-2 hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                  >
                    <input
                      type="radio"
                      name="image_url"
                      value={src}
                      defaultChecked={i === 0}
                      className="sr-only"
                    />
                    <Image
                      src={src}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </label>
                ))}
              </div>
            )}

            {mode === 'upload' && (
              <div className="flex flex-col items-start gap-3">
                <label
                  htmlFor="avatar"
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <PhotoIcon className="h-5 w-5" />
                  <span>Select image (PNG / JPG / WebP, max 2MB)</span>
                </label>
                <input
                  id="avatar"
                  name="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700"
                  onChange={handleFileChange}
                />
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}
              </div>
            )}

            {mode === 'library' && (
              <div className="flex items-center gap-3">
                {libraryUrl ? (
                  <>
                    <input type="hidden" name="image_url" value={libraryUrl} />
                    <img
                      src={libraryUrl}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setLibraryOpen(true)}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLibraryOpen(true)}
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Open library
                  </button>
                )}
              </div>
            )}

            <div id="image_url-error" aria-live="polite" aria-atomic="true">
              {state.errors?.image_url?.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
            </div>
          </fieldset>

          {state.message && (
            <p className="mt-2 text-sm text-red-500">{state.message}</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link
            href="/dashboard/customers"
            className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            Cancel
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create Customer'}
          </Button>
        </div>
      </form>

      <AvatarLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        initialItems={libraryItems}
        initialNextCursor={libraryNextCursor}
        initialHasMore={libraryHasMore}
        isAdmin={isAdmin}
        onLoadPage={loadMediaPageAction}
        onSelect={(url) => {
          setLibraryUrl(url);
          setMode('library');
          setLibraryOpen(false);
        }}
      />
    </>
  );
}

// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import {
//     UserCircleIcon,
//     AtSymbolIcon,
//     PhotoIcon,
// } from '@heroicons/react/24/outline';
// import { Button } from '@/app/ui/button';
// import { createCustomer, CustomerState } from '@/app/lib/actions';
// import { useActionState, useEffect, useState } from 'react';
// import Modal from '@/app/ui/modal';
// import {
//     CustomerErrorCode,
//     customerErrorMessages,
// } from '@/app/lib/customer-errors';


// import { PRESET_AVATARS } from '@/app/lib/avatars';
// import AvatarLibraryModal from '@/app/ui/customers/avatar-library-modal';
// import { loadMediaPageAction } from '@/app/lib/media-actions';
// import type { MediaAsset } from '@/app/lib/media';

// // const EXISTING_AVATARS = [
// //     '/customers/amy-burns.png',
// //     '/customers/balazs-orban.png',
// //     '/customers/delba-de-oliveira.png',
// //     '/customers/evil-rabbit.png',
// //     '/customers/lee-robinson.png',
// //     '/customers/michael-novotny.png',
// // ];

// function getErrorText(
//     codeOrMessage: string | undefined,
//     values?: { email?: string; name?: string },
// ) {
//     if (!codeOrMessage) return null;

//     // If it's a known code → use the mapped message
//     if (codeOrMessage in customerErrorMessages) {
//         return customerErrorMessages[codeOrMessage as CustomerErrorCode](values);
//     }

//     // Fallback for unknown / legacy messages
//     return codeOrMessage;
// }

// export default function Form({
//     libraryItems,
//     libraryTotalPages,
//     folders,
//     isAdmin = false,
//     // customer for edit...
// }: {
//     libraryItems: MediaAsset[];
//     libraryTotalPages: number;
//     folders: string[];
//     isAdmin?: boolean;
// }) {
//     const [mode, setMode] = useState<'preset' | 'upload' | 'library'>('preset');
//     const [libraryOpen, setLibraryOpen] = useState(false);
//     const [libraryUrl, setLibraryUrl] = useState<string | null>(null);
//     const initialState: CustomerState = { message: null, errors: {} };
//     const [state, formAction, isPending] = useActionState(createCustomer, initialState);
//     const [errorModalOpen, setErrorModalOpen] = useState(false);

//     // UI state: which mode the user is using

//     const [preview, setPreview] = useState<string | null>(null);

//     // Open modal when the unique-email (or any form-level) message appears
//     //   useEffect(()=> {
//     //     if (state.message) {
//     //       setErrorModalOpen(true);
//     //     }
//     //   }, [state.message]);
//     useEffect(() => {
//         if (!isPending && state.message) {
//             setErrorModalOpen(true);
//         }
//     }, [isPending, state.message]);

//     // Local errors for on-blur validation
//     const [clientErrors, setClientErrors] = useState<{
//         name?: string;
//         email?: string;
//     }>({});

//     function validateName(value: string) {
//         if (!value.trim()) return 'Please enter a name.';
//         if (value.length < 2) return 'Name is too short.';
//         if (value.length > 100) return 'Name is too long.';
//         return undefined;
//     }

//     function validateEmail(value: string) {
//         if (!value.trim()) return 'Please enter an email.';
//         if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
//             return 'Please enter a valid email address.';
//         }
//         return undefined;
//     }

//     function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
//         const error = validateName(e.target.value);
//         setClientErrors((prev) => ({ ...prev, name: error }));
//     }

//     function handleEmailBlur(e: React.FocusEvent<HTMLInputElement>) {
//         const error = validateEmail(e.target.value);
//         setClientErrors((prev) => ({ ...prev, email: error }));
//     }

//     // Prefer server error if present, otherwise show client error
//     const nameError =
//         state.errors?.name?.[0]/* map code to text if you use codes */ ||
//         clientErrors.name;

//     const emailError =
//         state.errors?.email?.[0] ||
//         clientErrors.email;

//     function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//         const file = e.target.files?.[0];
//         if (file) {
//             setPreview(URL.createObjectURL(file));
//         } else {
//             setPreview(null);
//         }
//     }

//     return (
//         <>
//             <form action={formAction}>
//                 <div className="rounded-md bg-gray-50 p-4 md:p-6">
//                     {/* Customer Name */}
//                     <div className="mb-4">
//                         <label htmlFor="name" className="mb-2 block text-sm font-medium">
//                             Customer name
//                         </label>
//                         <div className="relative">
//                             <input
//                                 id="name"
//                                 name="name"
//                                 type="text"
//                                 placeholder="Enter full name"
//                                 onBlur={handleNameBlur}
//                                 onChange={() =>
//                                     setClientErrors((prev) => ({ ...prev, name: undefined }))
//                                 }
//                                 className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
//                                 aria-describedby="name-error"
//                             />
//                             <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
//                         </div>
//                         <div id="name-error" aria-live="polite" aria-atomic="true">
//                             {nameError && (
//                                 <p className="mt-2 text-sm text-red-500">{nameError}</p>
//                             )}
//                         </div>
//                     </div>

//                     {/* Email */}
//                     <div className="mb-4">
//                         <label htmlFor="email" className="mb-2 block text-sm font-medium">
//                             Email
//                         </label>
//                         <div className="relative">
//                             <input
//                                 id="email"
//                                 name="email"
//                                 type="email"
//                                 placeholder="Enter email address"
//                                 onBlur={handleEmailBlur}
//                                 onChange={() =>
//                                     setClientErrors((prev) => ({ ...prev, email: undefined }))
//                                 }
//                                 className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
//                                 aria-describedby="email-error"
//                             />
//                             <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
//                         </div>
//                         <div id="email-error" aria-live="polite" aria-atomic="true">
//                             {emailError && (
//                                 <p className="mt-2 text-sm text-red-500">{emailError}</p>
//                             )}
//                         </div>
//                     </div>

//                     {/* Avatar section */}
//                     <fieldset className="mb-4">
//                         <legend className="mb-2 block text-sm font-medium">Avatar</legend>

//                         <div className="mb-4 flex flex-wrap gap-2">
//                             <button type="button" onClick={() => { setMode('preset'); setLibraryUrl(null); }} className={mode === 'preset' ? 'bg-blue-600 text-white' : 'bg-gray-200'}>
//                                 Presets
//                             </button>
//                             <button type="button" onClick={() => { setMode('upload'); setLibraryUrl(null); }} className={mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'}>
//                                 Upload new
//                             </button>
//                             <button type="button" onClick={() => setLibraryOpen(true)} className={mode === 'library' ? 'bg-blue-600 text-white' : 'bg-gray-200'}>
//                                 From library
//                             </button>
//                         </div>

//                         {mode === 'preset' && (
//                             <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
//                                 {PRESET_AVATARS.map((src: string) => (
//                                     <label key={src} className="flex cursor-pointer flex-col items-center gap-2 rounded-md border p-2 has-[:checked]:border-blue-500">
//                                         <input type="radio" name="image_url" value={src} className="sr-only" defaultChecked={src === PRESET_AVATARS[0]} />
//                                         <Image src={src} alt="" width={48} height={48} className="rounded-full" />
//                                     </label>
//                                 ))}
//                             </div>
//                         )}

//                         {mode === 'upload' && (
//                             <input name="avatar" type="file" accept="image/png,image/jpeg,image/webp" />
//                         )}

//                         {mode === 'library' && libraryUrl && (
//                             <>
//                                 <input type="hidden" name="image_url" value={libraryUrl} />
//                                 <img src={libraryUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
//                             </>
//                         )}
//                     </fieldset>

//                     <AvatarLibraryModal
//                         open={libraryOpen}
//                         onClose={() => setLibraryOpen(false)}
//                         initialItems={libraryItems}
//                         initialTotalPages={libraryTotalPages}
//                         folders={folders}
//                         isAdmin={isAdmin}
//                         onLoadPage={loadMediaPageAction}
//                         onSelect={(url) => {
//                             setLibraryUrl(url);
//                             setMode('library');
//                             setLibraryOpen(false);
//                         }}
//                     />


//                     {/* Form-level message */}
//                     <div aria-live="polite" aria-atomic="true">
//                         {state.message && (
//                             <p className="mt-2 text-sm text-red-500">{state.message}</p>
//                         )}
//                     </div>
//                 </div>

//                 <div className="mt-6 flex justify-end gap-4">
//                     <Link
//                         href="/dashboard/customers"
//                         className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
//                     >
//                         Cancel
//                     </Link>
//                     <Button type="submit">Create Customer</Button>
//                 </div>
//             </form>
//             <Modal
//                 open={errorModalOpen}
//                 onClose={() => setErrorModalOpen(false)}
//                 title="Cannot save customer"
//                 footer={
//                     <button
//                         type="button"
//                         onClick={() => setErrorModalOpen(false)}
//                         className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
//                     >
//                         OK
//                     </button>
//                 }
//             >
//                 {/* <p className="mt-2 text-red-600">
//                     {state.values?.email
//                         ? `"${state.values.email}" is already in use. Please try a new email address.`
//                         : 'This email is already in use. Please try a new email address.'}
//                 </p> */}
//                 <p>{getErrorText(state.message ?? state.errorCodes?.[0], state.values)}</p>
//             </Modal>
//         </>
//     );
// }