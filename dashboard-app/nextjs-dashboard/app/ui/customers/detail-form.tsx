import Image from 'next/image';
import InvoiceStatus from '@/app/ui/invoices/status';
import { formatCurrency, formatDateToLocal } from '@/app/lib/utils';
import { lusitana } from '@/app/ui/fonts';
import { FormattedCustomersTable, InvoicesTable } from '@/app/lib/definitions';



export default function DetailCustomerForm({ customer,
    invoices, }: {
        customer: FormattedCustomersTable;
        invoices: InvoicesTable[];
    }) {

    return (
        <>
            {/* ── Profile header ─────────────────────────────────────────── */}
            <div className="mb-8 flex items-center gap-4">
                <Image
                    src={customer.image_url}
                    alt={`${customer.name}'s profile picture`}
                    width={64}
                    height={64}
                    className="rounded-full"
                />
                <div>
                    <h1 className={`${lusitana.className} text-2xl`}>{customer.name}</h1>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                </div>
            </div>

            {/* ── Summary stats ──────────────────────────────────────────── */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Total Invoices</p>
                    <p className="text-2xl font-semibold">{customer.total_invoices}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Total Pending</p>
                    <p className="text-2xl font-semibold">{customer.total_pending}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Total Paid</p>
                    <p className="text-2xl font-semibold">{customer.total_paid}</p>
                </div>
            </div>

            {/* ── Invoice history ────────────────────────────────────────── */}
            <h2 className={`${lusitana.className} mb-4 text-xl`}>Invoices</h2>

            {invoices.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
                    This customer has no invoices yet.
                </div>
            ) : (
                <div className="mt-4 flow-root">
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
                                <table className="min-w-full text-gray-900">
                                    <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                                        <tr>
                                            <th className="px-4 py-5 font-medium sm:pl-6">Date</th>
                                            <th className="px-3 py-5 font-medium">Amount</th>
                                            <th className="px-3 py-5 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {invoices.map((invoice) => (
                                            <tr key={invoice.id} className="group">
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                    {formatDateToLocal(invoice.date)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    {formatCurrency(invoice.amount)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <InvoiceStatus status={invoice.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>


    );
}