'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserCircleIcon,
  AtSymbolIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createCustomer, CustomerState } from '@/app/lib/actions';
import { useActionState } from 'react';

const EXISTING_AVATARS = [
  '/customers/amy-burns.png',
  '/customers/balazs-orban.png',
  '/customers/delba-de-oliveira.png',
  '/customers/evil-rabbit.png',
  '/customers/lee-robinson.png',
  '/customers/michael-novotny.png',
];

export default function Form({
    existingAvatars,
  }: {
    existingAvatars: string[];
  }) {
  const initialState: CustomerState = { message: null, errors: {} };
  const [state, formAction] = useActionState(createCustomer, initialState);

  // UI state: which mode the user is using
  const [mode, setMode] = useState<'existing' | 'upload'>('existing');
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Customer Name */}
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Customer name
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter full name"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby="name-error"
            />
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.name?.map((error) => (
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
              placeholder="Enter email address"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby="email-error"
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
          <div id="email-error" aria-live="polite" aria-atomic="true">
            {state.errors?.email?.map((error) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
          </div>
        </div>

        {/* Avatar section */}
        <fieldset className="mb-4">
        <legend className="mb-2 block text-sm font-medium">Avatar</legend>

        {/* Mode switcher */}
        <div className="mb-4 flex gap-4">
          <button
            type="button"
            onClick={()=> {
              setMode('existing');
              setPreview(null);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === 'existing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Choose existing
          </button>
          <button
            type="button"
            onClick={()=> setMode('upload')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Upload new
          </button>
        </div>

        {/* Dynamic existing avatars */}
        {mode === 'existing' && (
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {existingAvatars.map((src)=> (
              <label
                key={src}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-gray-200 p-2 hover:bg-gray-100 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
              >
                <input
                  type="radio"
                  name="image_url"
                  value={src}
                  className="sr-only"
                  defaultChecked={src === existingAvatars[0]}
                />
                <Image
                  src={src}
                  alt="Customer avatar"
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              </label>
            ))}
          </div>
        )}

        {/* Upload new – same as before */}
        {mode === 'upload' && (
          <div className="flex flex-col items-start gap-3">
            <label
              htmlFor="avatar"
              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:bg-gray-100"
            >
              <PhotoIcon className="h-5 w-5" />
              <span>Select image (PNG / JPG)</span>
            </label>
            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {preview && (
              <div className="mt-2">
                <p className="mb-1 text-xs text-gray-500">Preview:</p>
                <img
                  src={preview}
                  alt="Preview"
                  className="h-16 w-16 rounded-full object-cover"
                />
              </div>
            )}
          </div>
        )}

        <div id="image_url-error" aria-live="polite" aria-atomic="true">
          {state.errors?.image_url?.map((error)=> (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
          ))}
        </div>
      </fieldset>

        {/* Form-level message */}
        <div aria-live="polite" aria-atomic="true">
          {state.message && (
            <p className="mt-2 text-sm text-red-500">{state.message}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/customers"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Create Customer</Button>
      </div>
    </form>
  );
}