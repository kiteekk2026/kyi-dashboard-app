import Form from '@/app/ui/customers/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import {fetchCustomerById }from '@/app/lib/data';
import {getExistingAvatars }from '@/app/lib/avatars';
import {notFound }from 'next/navigation';
import {Metadata }from 'next';

export const metadata: Metadata = {
  title:'Edit Customer',
};

export default async function Page(props: {
  params: Promise<{id: string }>;
}) {
  const {id }= await props.params;

  const [customer,existingAvatars]= await Promise.all([
    fetchCustomerById(id),
    getExistingAvatars(),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label:'Customers', href:'/dashboard/customers' },
          {
            label:'Edit Customer',
            href:`/dashboard/customers/${id}/edit`,
            active:true,
          },
        ]}
      />
      <Form customer={customer} existingAvatars={existingAvatars} />
    </main>
  );
}