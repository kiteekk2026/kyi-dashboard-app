'use client';

import { useState, useTransition } from 'react';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteCustomer } from '@/app/lib/actions';
import Modal from '@/app/ui/modal';

export function CreateCustomer() {
  return (
    <Link
      href="/dashboard/customers/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Customer</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateCustomer({
  id,
  returnTo,
}: {
  id: string;
  returnTo?: string;
}) {
  const href = returnTo
    ? `/dashboard/customers/${id}/edit?returnTo=${encodeURIComponent(returnTo)}`
    : `/dashboard/customers/${id}/edit`;

  return (
    <Link href={href} className="rounded-md border p-2 hover:bg-gray-100">
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteCustomer({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  function handleConfirm() {
    setConfirmOpen(false);

    startTransition(async () => {
      const result = await deleteCustomer(id);

      if (!result.success) {
        setErrorMessage(result.message || 'Failed to delete customer.');
        setErrorOpen(true);
        return;
      }

      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        className="rounded-md border p-2 hover:bg-gray-100 disabled:opacity-50"
        title="Delete customer"
        aria-label={`Delete ${name}`}
      >
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete customer"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p>
          Do you want to delete <strong>{name}</strong>?
        </p>
        <p className="mt-2 text-gray-500">
          This action cannot be undone. All of their paid invoices will be
          archived and then removed.
        </p>
      </Modal>

      <Modal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        title="Cannot delete customer"
        footer={
          <button
            type="button"
            onClick={() => setErrorOpen(false)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            OK
          </button>
        }
      >
        <p>{errorMessage}</p>
      </Modal>
    </>
  );
}