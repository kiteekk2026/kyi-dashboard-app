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
import {writeFile,mkdir }from 'fs/promises';
import path from 'path';
import {randomUUID }from 'crypto';

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


  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  const validatedFields  = UpdateInvoice.safeParse({
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


  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice');

  await sql`DELETE FROM invoices WHERE id = ${id}`;
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
// export async function signInWithGoogle(formData: FormData) {
//   const origin = (await headers()).get('origin');
//   const next = safeRedirectPath(formData.get('redirectTo'));

//   const supabase = await createClient();
//   const { data, error } = await supabase.auth.signInWithOAuth({
//     provider: 'google',
//     options: {
//       redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
//       queryParams: {
//         access_type: 'offline',
//         prompt: 'consent',
//       },
//     },
//   });

//   if (error || !data.url) redirect('/login?error=oauth');

//   redirect(data.url);
// }

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
]as const;

const CustomerFormSchema = z.object({
  name:z.string().min(1, { message:'Please enter a name.' }),
  email:z.string().email({ message:'Please enter a valid email.' }),
  image_url:z.string().optional(),// will be filled by us
});

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    image_url?: string[];
  };
  message?: string | null;
};

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
) {
  // 1. Basic field validation
  const validatedFields = CustomerFormSchema.safeParse({
    name:formData.get('name'),
    email:formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      errors:validatedFields.error.flatten().fieldErrors,
      message:'Missing Fields. Failed to Create Customer.',
    };
  }

  const {name,email }= validatedFields.data;

  // 2. Resolve the image
  let image_url: string | null = null;

  const existing = formData.get('image_url')as string | null;
  const file = formData.get('avatar')as File | null;

  if (file && file.size > 0) {
    // ----- Upload path -----
    // Basic safety checks
    if (!file.type.startsWith('image/')) {
      return {
        errors: { image_url: ['Only image files are allowed.'] },
        message:'Invalid file type.',
      };
    }
    if (file.size > 2 * 1024 * 1024) {
      // 2 MB limit
      return {
        errors: { image_url: ['Image must be smaller than 2 MB.'] },
        message:'File too large.',
      };
    }

    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Ensure directory exists
      const uploadDir = path.join(process.cwd(),'public','customers');
      await mkdir(uploadDir, { recursive:true });

      // Unique filename
      const ext = path.extname(file.name)|| '.png';
      const filename = `${randomUUID()}${ext}`;
      const filepath = path.join(uploadDir,filename);

      await writeFile(filepath,buffer);
      image_url = `/customers/${filename}`;
    }catch (err) {
      console.error('Upload error:',err);
      return {
        message:'Failed to upload image.',
      };
    }
  }else if (existing && ALLOWED_EXISTING.includes(existing as any)) {
    // ----- Existing avatar path -----
    image_url = existing;
  }else {
    return {
      errors: { image_url: ['Please select or upload an avatar.'] },
      message:'Missing avatar.',
    };
  }

  // 3. Insert into database
  try {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name}, ${email}, ${image_url})
    `;
  }catch (error) {
    return {
      message:'Database Error: Failed to Create Customer.',
    };
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}