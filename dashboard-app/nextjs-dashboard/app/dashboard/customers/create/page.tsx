import Form from '@/app/ui/customers/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import {getExistingAvatars }from '@/app/lib/avatars';
import {Metadata }from 'next';
import {listMediaAssets,listMediaFolders }from '@/app/lib/media';

export const metadata: Metadata = {
  title:'Create Customer',
};

export default async function Page() {
  const [{items,totalPages },folders]= await Promise.all([
    listMediaAssets({ page:1, folder:'customers' }),
    listMediaFolders(),
  ]);

  const isAdmin = false;// replace with real role check

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
      <Form
        libraryItems={items}
        libraryTotalPages={totalPages}
        folders={folders}
        isAdmin={isAdmin}
      />
    </main>
  );
}

// export default async function Page() {
//   const existingAvatars = await getExistingAvatars();

//   return (
//     <main>
//       <Breadcrumbs
//         breadcrumbs={[
//           { label:'Customers', href:'/dashboard/customers' },
//           {
//             label:'Create Customer',
//             href:'/dashboard/customers/create',
//             active:true,
//           },
//         ]}
//       />
//       <Form existingAvatars={existingAvatars} />
//     </main>
//   );
// }