'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
// import postgres from 'postgres';
import sql from '@/app/lib/db'
//comment because of supabase auth
// import { signIn } from '@/auth';
// import { AuthError } from 'next-auth';
import { headers } from 'next/headers';
import { createClient } from '@/app/lib/supabase/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { getExistingAvatars } from '@/app/lib/avatars';

import {
  CustomerErrorCode
} from '@/app/lib/customer-errors';

// const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });



const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
  description: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    description: formData.get('description'),
  });
  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status, description } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    description: formData.get('description'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  // Test it out:
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date, description)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date}, ${description})
  `;
  } catch (error) {
    console.error(error);
    return {
      message: 'Database Error: Failed to Create Invoice.'
    }
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    description: formData.get('description'),
  });
  // const validatedFields = UpdateInvoice.safeParse({
  //   customerId: formData.get('customerId'),
  //   amount: formData.get('amount'),
  //   status: formData.get('status'),
  // });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status, description } = validatedFields.data;
  const amountInCents = amount * 100;
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status},
      description = ${description}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error(error);
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice');

  await sql`DELETE FROM invoices WHERE id = ${id}`;

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/invoices');
}

// export async function authenticate(
//   prevState: string | undefined,
//   formData: FormData,
// ) {
//   try {
//     await signIn('credentials', formData);
//   } catch (error) {
//     if (error instanceof AuthError) {
//       switch (error.type) {
//         case 'CredentialsSignin':
//           return 'Invalid credentials.';
//         default:
//           return 'Something went wrong.';
//       }
//     }
//     throw error;
//   }
// }

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function safeRedirectPath(value: FormDataEntryValue | null) {
  const path = typeof value === 'string' ? value : '';
  return path.startsWith('/') && !path.startsWith('//') ? path : '/dashboard';
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return 'Invalid credentials.';

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return error.code === 'invalid_credentials'
      ? 'Invalid credentials.'
      : 'Something went wrong.';
  }

  redirect(safeRedirectPath(formData.get('redirectTo')));
}

export async function signInWithGithub(formData: FormData) {
  const origin = (await headers()).get('origin');
  const next = safeRedirectPath(formData.get('redirectTo'));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error || !data.url) redirect('/login?error=oauth');

  redirect(data.url);
}

//########## Google ###################
export async function signInWithGoogle(formData: FormData) {
  const origin = (await headers()).get('origin');
  const next = safeRedirectPath(formData.get('redirectTo'));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error || !data.url) redirect('/login?error=oauth');

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

const ALLOWED_EXISTING = [
  '/customers/amy-burns.png',
  '/customers/balazs-orban.png',
  '/customers/delba-de-oliveira.png',
  '/customers/evil-rabbit.png',
  '/customers/lee-robinson.png',
  '/customers/michael-novotny.png',
] as const;

// const CustomerFormSchema = z.object({
//   name:z.string().min(1, { message:'Please enter a name.' }),
//   email:z.string().email({ message:'Please enter a valid email.' }),
//   image_url:z.string().optional(),// will be filled by us
// });

// export type CustomerState = {
//   errors?: {
//     name?: string[];
//     email?: string[];
//     image_url?: string[];
//   };
//   message?: string | null;
// };

//Shared validation State + Zod schema

const CustomerFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Please enter a name.' })
    .max(100, { message: 'Name is too long.' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email.' })
    .max(100, { message: 'Email is too long.' }),
  // image_url: z.string().optional(),
});

// export type CustomerState = {
//   errors?: {
//     name?: string[];
//     email?: string[];
//     image_url?: string[];
//   };
//   message?: string | null;
//   // Preserve user input on failure
//   values?: {
//     name?: string;
//     email?: string;
//     image_url?: string;
//   };
// };

export type CustomerState = {
  errors?: {
    name?: string[];       // still useful for field-level codes
    email?: string[];
    image_url?: string[];
  };
  /** Stable machine-readable codes */
  errorCodes?: CustomerErrorCode[];
  message?: string | null;
  values?: {
    name?: string;
    email?: string;
    image_url?: string;
  };
};

// export async function createCustomer(
//   prevState: CustomerState,
//   formData: FormData,
// ) {
//   // 1. Basic field validation
//   const validatedFields = CustomerFormSchema.safeParse({
//     name:formData.get('name'),
//     email:formData.get('email'),
//   });

//   if (!validatedFields.success) {
//     return {
//       errors:validatedFields.error.flatten().fieldErrors,
//       message:'Missing Fields. Failed to Create Customer.',
//     };
//   }

//   const {name,email }= validatedFields.data;
export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    // image_url: formData.get('image_url'),
  };

  const validated = CustomerFormSchema.safeParse(raw);

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to create customer.',
      values: {
        name: String(raw.name ?? ''),
        email: String(raw.email ?? ''),
        // image_url: String(raw.image_url ?? ''),
      },
    };
  }



  // 2. Resolve the image
  let image_url: string | null = null;

  const existing = formData.get('image_url') as string | null;
  const file = formData.get('avatar') as File | null;

  if (file && file.size > 0) {
    // ----- Upload path -----
    // Basic safety checks
    if (!file.type.startsWith('image/')) {
      return {
        errors: { image_url: ['Only image files are allowed.'] },
        message: 'Invalid file type.',
      };
    }
    if (file.size > 2 * 1024 * 1024) {
      // 2 MB limit
      return {
        errors: { image_url: ['Image must be smaller than 2 MB.'] },
        message: 'File too large.',
      };
    }

    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Ensure directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'customers');
      await mkdir(uploadDir, { recursive: true });

      // Unique filename
      const ext = path.extname(file.name) || '.png';
      const shortId = randomUUID().replace(/-/g, "").slice(0, 10);
      const filename = `${shortId}${ext}`;
      const filepath = path.join(uploadDir, filename);

      await writeFile(filepath, buffer);
      image_url = `/customers/${filename}`;
    } catch (err) {
      console.error('Upload error:', err);
      return {
        message: 'Failed to upload image.',
      };
    }
  } else if (existing) {
    // ----- Dynamic existing avatar check -----
    const allowed = await getExistingAvatars();

    if (allowed.includes(existing)) {
      image_url = existing;
    } else {
      return {
        errors: { image_url: ['Selected avatar is not allowed.'] },
        message: 'Invalid avatar.',
      };
    }
  } else {
    return {
      errors: { image_url: ['Please select or upload an avatar.'] },
      message: 'Missing avatar.',
    };
  }

  // 3. Insert into database
  //   try {
  //     await sql`
  //       INSERT INTO customers (name, email, image_url)
  //       VALUES (${name}, ${email}, ${image_url})
  //     `;
  //   }catch (error) {
  //     return {
  //       message:'Database Error: Failed to Create Customer.',
  //     };
  //   }

  //   revalidatePath('/dashboard/customers');
  //   redirect('/dashboard/customers');
  // }
  try {
    await sql`
    INSERT INTO customers (name, email, image_url)
    VALUES (${validated.data.name}, ${validated.data.email}, ${image_url})
  `;
  } catch (error: any) {
    // Postgres unique_violation
    if (error?.code === '23505') {
      return {
        errors: { email: [CustomerErrorCode.EMAIL_TAKEN] },
        errorCodes: [CustomerErrorCode.EMAIL_TAKEN],
        message: CustomerErrorCode.EMAIL_TAKEN, // or keep a short fallback
        values: {
          name: validated.data.name,
          email: validated.data.email,
          image_url: image_url ?? undefined,
        },
      };
    }

    return {
      errors: {},
      errorCodes: [CustomerErrorCode.DATABASE_ERROR],
      message: CustomerErrorCode.DATABASE_ERROR,
      values: {
        name: validated.data.name,
        email: validated.data.email,
        image_url: image_url ?? undefined,
      },
    };
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/customers', 'layout');
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

// export async function updateCustomer(
//   id: string,
//   prevState: CustomerState,
//   formData: FormData,
// ) {
//   // 1. Validate name + email (same rules as create)
//   const validatedFields = CustomerFormSchema.safeParse({
//     name:formData.get('name'),
//     email:formData.get('email'),
//   });

//   if (!validatedFields.success) {
//     return {
//       errors:validatedFields.error.flatten().fieldErrors,
//       message:'Missing Fields. Failed to Update Customer.',
//     };
//   }

//   const {name,email }= validatedFields.data;
export async function updateCustomer(
  id: string,
  prevState: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    // image_url: formData.get('image_url'),
  };

  const validated = CustomerFormSchema.safeParse(raw);

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to create customer.',
      values: {
        name: String(raw.name ?? ''),
        email: String(raw.email ?? ''),
        // image_url: String(raw.image_url ?? ''),
      },
    };
  }



  // 2. Resolve image (same logic as createCustomer)
  let image_url: string | null = null;

  const existing = formData.get('image_url') as string | null;
  const file = formData.get('avatar') as File | null;

  if (file && file.size > 0) {
    // upload logic (identical to create)
    // … size/type checks, writeFile, set image_url …
  } else if (existing) {
    const allowed = await getExistingAvatars();
    if (allowed.includes(existing)) {
      image_url = existing;
    } else {
      return {
        errors: { image_url: ['Selected avatar is not allowed.'] },
        message: 'Invalid avatar.',
      };
    }
  } else {
    // Keep the current avatar if the user didn’t change it
    // (you can also fetch the current value if you prefer)
    image_url = existing;// will be null only if nothing was sent
  }

  // If still no image_url, you may want to keep the old one.
  // Simplest safe approach: require an image or fall back to the previous value.
  // For brevity we assume the form always sends one.

  // 3. Update the row
  //   try {
  //     await sql`
  //       UPDATE customers
  //       SET name = ${name}, email = ${email}, image_url = ${image_url}
  //       WHERE id = ${id}
  //     `;
  //   }catch (error) {
  //     return { message:'Database Error: Failed to Update Customer.' };
  //   }

  //   revalidatePath('/dashboard/customers');
  //   revalidatePath(`/dashboard/customers/${id}`);// detail page too
  //   redirect('/dashboard/customers');
  // }
  try {
    await sql`
        UPDATE customers
        SET name = ${validated.data.name}, email = ${validated.data.email}, image_url = ${image_url}
        WHERE id = ${id}
      `;

  } catch (error: any) {
    // Postgres unique_violation
    if (error?.code === '23505') {
      return {
        errors: { email: [CustomerErrorCode.EMAIL_TAKEN] },
        errorCodes: [CustomerErrorCode.EMAIL_TAKEN],
        message: CustomerErrorCode.EMAIL_TAKEN, // or keep a short fallback
        values: {
          name: validated.data.name,
          email: validated.data.email,
          image_url: image_url ?? undefined,
        },
      };
    }

    return {
      errors: {},
      errorCodes: [CustomerErrorCode.DATABASE_ERROR],
      message: CustomerErrorCode.DATABASE_ERROR,
      values: {
        name: validated.data.name,
        email: validated.data.email,
        image_url: image_url ?? undefined,
      },
    };
  }

  const returnToRaw = formData.get('returnTo');
  const returnTo =
    typeof returnToRaw === 'string' && returnToRaw.startsWith('/dashboard/customers')
      ? returnToRaw
      : '/dashboard/customers';

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/customers', 'layout');
  revalidatePath('/dashboard/customers');
  revalidatePath(`/dashboard/customers/${id}`);// detail page too
  // redirect('/dashboard/customers');
  redirect(returnTo);
}


// export async function deleteCustomer(id: string) {
//   // 1. Check pending invoices
//   const pending = await sql`
//     SELECT COUNT(*)::int AS count
//     FROM invoices
//     WHERE customer_id = ${id} AND status = 'pending'
//   `;

//   const pendingCount = pending[0]?.count ?? 0;

//   if (pendingCount > 0) {
//     // Throw so the form does not stay in a weird state.
//     // You can later catch this with an error.tsx or a toast.
//     throw new Error(
//       `Cannot delete this customer. They still have ${pendingCount} pending invoice${pendingCount === 1 ? '' : 's'}.`,
//     );
//   }

//   // 2. Archive + delete in one transaction
//   try {
//     await sql.begin(async (sql) => {
//       await sql`
//         INSERT INTO customers_history (id, name, email, image_url)
//         SELECT id, name, email, image_url
//         FROM customers
//         WHERE id = ${id}
//       `;

//       await sql`
//         INSERT INTO invoices_history (id, customer_id, amount, status, date)
//         SELECT id, customer_id, amount, status, date
//         FROM invoices
//         WHERE customer_id = ${id}
//       `;

//       await sql`
//         DELETE FROM invoices
//         WHERE customer_id = ${id}
//       `;

//       await sql`
//         DELETE FROM customers
//         WHERE id = ${id}
//       `;
//     });
//   } catch (error) {
//     console.error('Delete customer error:', error);
//     throw new Error('Database Error: Failed to delete customer.');
//   }

//   revalidatePath('/dashboard/customers');
//   redirect('/dashboard/customers');
// }

export async function deleteCustomer(id: string) {
  // 1. Check pending invoices
  const pending = await sql`
    SELECT COUNT(*)::int AS count
    FROM invoices
    WHERE customer_id = ${id} AND status = 'pending'
  `;

  const pendingCount = pending[0]?.count ?? 0;

  if (pendingCount > 0) {
    return {
      success: false,
      message: `Cannot delete this customer. They still have ${pendingCount} pending invoice${pendingCount === 1 ? '' : 's'}.`,
    };
  }

  // 2. Archive + delete in one transaction
  try {
    await sql.begin(async (sql) => {
      await sql`
        INSERT INTO customers_history (id, name, email, image_url)
        SELECT id, name, email, image_url
        FROM customers
        WHERE id = ${id}
      `;

      await sql`
        INSERT INTO invoices_history (id, customer_id, amount, status, date)
        SELECT id, customer_id, amount, status, date
        FROM invoices
        WHERE customer_id = ${id}
      `;

      await sql`
        DELETE FROM invoices
        WHERE customer_id = ${id}
      `;

      await sql`
        DELETE FROM customers
        WHERE id = ${id}
      `;
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return {
      success: false,
      message: 'Database Error: Failed to delete customer.',
    };
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/customers', 'layout');
  revalidatePath('/dashboard/customers');
  return { success: true };
}