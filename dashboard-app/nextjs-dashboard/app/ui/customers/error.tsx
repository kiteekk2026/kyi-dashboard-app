'use client';

import {useEffect }from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & {digest?: string };
  reset: ()=> void;
}) {
  useEffect(()=> {
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4">
      <h2 className="text-center text-xl font-semibold">
        Something went wrong
      </h2>
      <p className="text-center text-gray-500">
        An unexpected error occurred while loading customers.
      </p>
      <button
        className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
        onClick={()=> reset()}
      >
        Try again
      </button>
    </main>
  );
}