'use client';

import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteInvoice } from '@/app/lib/actions';
import { useState } from 'react';



export function CreateInvoice() {

  return (
    <Link
      href="/dashboard/invoices/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Invoice</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateInvoice({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/invoices/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

// export function DeleteInvoice({ id }: { id: string }) {
//   const deleteInvoiceWithId = deleteInvoice.bind(null, id);
//   return (

//     <form action={deleteInvoiceWithId}>
//       <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
//         <span className="sr-only">Delete</span>
//         <TrashIcon className="w-5" />
//       </button>
//     </form>
//   );
// }

// export function DeleteInvoice({ id }: { id: string }) {
//   const deleteInvoiceWithId = deleteInvoice.bind(null, id);

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     const confirmed = window.confirm(
//       'Are you sure you want to delete this invoice? This action cannot be undone.'
//     );
//     if (!confirmed) {
//       e.preventDefault(); // Stop form submission if user cancels
//     }
//   };

//   return (
//     <form action={deleteInvoiceWithId} onSubmit={handleSubmit}>
//       <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
//         <span className="sr-only">Delete</span>
//         <TrashIcon className="w-5" />
//       </button>
//     </form>
//   );
// }

export function DeleteInvoice({ id }: { id: string }) {
  const [showModal, setShowModal] = useState(false);
  const deleteInvoiceWithId = deleteInvoice.bind(null, id);

  return (
    <>
      {/* Trash button — just opens the modal, no form yet */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="rounded-md border p-2 hover:bg-gray-100"
      >
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />

          {/* Modal card */}
          <div className="relative z-10 w-full max-w-md mx-4 rounded-xl bg-white p-6 shadow-xl">
            {/* Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <TrashIcon className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              Delete Invoice
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Are you sure you want to delete this invoice? <br />
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              {/* Cancel */}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              {/* Confirm — this is the actual Server Action form */}
              {/* <form action={deleteInvoiceWithId}>
                <button
                  type="submit"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                >
                  Delete
                </button>
              </form> */}
              <form action={deleteInvoiceWithId}>
                <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
                  <span className="sr-only">Delete</span>
                  <TrashIcon className="w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}