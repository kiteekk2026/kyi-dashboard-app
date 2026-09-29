import Form from '@/app/ui/customers/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import {getExistingAvatars }from '@/app/lib/avatars';
import {Metadata }from 'next';

export const metadata: Metadata = {
  title:'Create Customer',
};

export default async function Page() {
  const existingAvatars = await getExistingAvatars();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label:'Customers', href:'/dashboard/customers' },
          {
            label:'Create Customer',
            href:'/dashboard/customers/create',
            active:true,
          },
        ]}
      />
      <Form existingAvatars={existingAvatars} />
    </main>
  );
}