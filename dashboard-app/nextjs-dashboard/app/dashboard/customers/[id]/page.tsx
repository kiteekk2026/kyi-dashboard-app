import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
    fetchCustomerById,
    fetchInvoicesByCustomerId,
} from '@/app/lib/data';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import CustomerDetail from '@/app/ui/customers/detail-form'
import { Suspense } from 'react';
import { CustomerDetailSkeleton } from '@/app/ui/skeletons';

export const metadata: Metadata = {
    title: 'Customer Details',
};

export default async function Page(props: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await props.params;

    // Parallel fetch – both are independent
    const [customer, invoices] = await Promise.all([
        fetchCustomerById(id),
        fetchInvoicesByCustomerId(id),
    ]);

    if (!customer) {
        notFound();// → renders not-found.tsx in this segment
    }

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Customers', href: '/dashboard/customers' },
                    {
                        label: customer.name,
                        href: `/dashboard/customers/${id}`,
                        active: true,
                    },
                ]}
            />
            <Suspense fallback={<CustomerDetailSkeleton />}>
                <CustomerDetail customer={customer} invoices={invoices}></CustomerDetail>
            </Suspense>
            

        </main>
    );
}