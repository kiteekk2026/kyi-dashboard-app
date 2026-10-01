import { lusitana } from '@/app/ui/fonts';
import Search from '@/app/ui/search';
import CustomersTable from '@/app/ui/customers/table';
import { CustomersTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchCustomersPages } from '@/app/lib/data';
import { Metadata } from 'next';
import Pagination from '@/app/ui/pagination';
import { CreateCustomer } from '@/app/ui/customers/buttons';

export const metadata: Metadata = {
  title: 'Customers',
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  // Build the URL to return to after edit
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (currentPage > 1) params.set('page', String(currentPage));

  const returnTo =
    params.toString().length > 0
      ? `/dashboard/customers?${params.toString()}`
      : '/dashboard/customers';

  const totalPages = await fetchCustomersPages(query);

  return (
    <div className="w-full">
      <h1 className={`${lusitana.className} mb-8 text-xl md:text-2xl`}>
        Customers
      </h1>

      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search customers..." />
        <CreateCustomer />
      </div>

      <Suspense
        key={query + currentPage}
        fallback={<CustomersTableSkeleton />}
      >
        {/* PASS returnTo HERE */}
        <CustomersTable
          query={query}
          currentPage={currentPage}
          returnTo={returnTo}
        />
      </Suspense>

      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}