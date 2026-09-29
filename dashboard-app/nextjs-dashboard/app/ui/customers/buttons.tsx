'use client';

import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteCustomer } from '@/app/lib/actions';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';


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

  export function UpdateCustomer({ id }: { id: string }) {
    return (
      <Link
        href={`/dashboard/customers/${id}/edit`}
        className="rounded-md border p-2 hover:bg-gray-100"
      >
        <PencilIcon className="w-5" />
      </Link>
    );
  }

//   export function DeleteCustomer({ id }: { id: string }) {
//     const deleteCustomerWithId = deleteCustomer.bind(null, id);
  
//     return (
//       <form action={deleteCustomerWithId}>
//         <button
//           type="submit"
//           className="rounded-md border p-2 hover:bg-gray-100"
//           title="Delete customer"
//         >
//           <span className="sr-only">Delete</span>
//           <TrashIcon className="w-5" />
//         </button>
//       </form>
//     );
//   }

export function DeleteCustomer({
    id,
    name,
  }: {
    id: string;
    name: string;
  }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
  
    async function handleDelete() {
      const confirmed = window.confirm(
        `Do you want to delete "${name}"?\n`,
      );
  
      if (!confirmed) return;
  
      startTransition(async () => {
        const result = await deleteCustomer(id);
  
        if (!result.success) {
          // Friendly popup instead of the crazy error page
          window.alert(result.message);
          return;
        }
  
        // Success → refresh the list
        router.refresh();
      });
    }
  
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-md border p-2 hover:bg-gray-100 disabled:opacity-50"
        title="Delete customer"
      >
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>
    );
  }