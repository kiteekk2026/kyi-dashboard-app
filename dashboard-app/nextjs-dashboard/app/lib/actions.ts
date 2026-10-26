'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import sql from '@/app/lib/db';
import { headers } from 'next/headers';
import { createClient } from '@/app/lib/supabase/server';
import { isAllowedAvatarUrl } from '@/app/lib/avatars';
import { uploadCustomerAvatar } from '@/app/lib/blob';
import { CustomerErrorCode } from '@/app/lib/customer-errors';

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
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
    description?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status, description } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date, description)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date}, ${description})
    `;
  } catch (error) {
    console.error(error);
    return { message: 'Database Error: Failed to Create Invoice.' };
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    description: formData.get('description'),
  });

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
      SET customer_id = ${customerId},
          amount = ${amountInCents},
          status = ${status},
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

/** Form action: must return void (no { message } object) */
export async function deleteInvoice(id: string): Promise<void> {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    console.error(error);
    throw new Error('Database Error: Failed to Delete Invoice.');
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/invoices');
}

// ---------------------------------------------------------------------------
// Auth (Supabase)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

const CustomerFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Please enter a name.' })
    .max(100, { message: 'Name is too long.' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email.' })
    .max(100, { message: 'Email is too long.' }),
});

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    image_url?: string[];
  };
  errorCodes?: CustomerErrorCode[];
  message?: string | null;
  values?: {
    name?: string;
    email?: string;
    image_url?: string;
  };
};

async function resolveCustomerImage(
  formData: FormData,
  options?: { fallbackImageUrl?: string | null },
): Promise<
  | { ok: true; image_url: string }
  | { ok: false; state: CustomerState }
> {
  const existing = formData.get('image_url');
  const file = formData.get('avatar');
  const name = String(formData.get('name') ?? '');
  const email = String(formData.get('email') ?? '');

  const hasFile =
    file &&
    typeof file === 'object' &&
    'size' in file &&
    (file as File).size > 0;

  if (hasFile) {
    try {
      const image_url = await uploadCustomerAvatar(file as File);
      return { ok: true, image_url };
    } catch (err) {
      console.error('Upload error:', err);
      return {
        ok: false,
        state: {
          message:
            err instanceof Error ? err.message : 'Failed to upload image.',
          errors: { image_url: ['Failed to upload image.'] },
          values: { name, email },
        },
      };
    }
  }

  if (typeof existing === 'string' && existing.length > 0) {
    if (!isAllowedAvatarUrl(existing)) {
      return {
        ok: false,
        state: {
          errors: { image_url: ['Selected avatar is not allowed.'] },
          message: 'Invalid avatar.',
          values: { name, email },
        },
      };
    }
    return { ok: true, image_url: existing };
  }

  if (options?.fallbackImageUrl) {
    return { ok: true, image_url: options.fallbackImageUrl };
  }

  return {
    ok: false,
    state: {
      errors: { image_url: ['Please select or upload an avatar.'] },
      message: 'Missing or invalid fields. Failed to save customer.',
      values: { name, email },
    },
  };
}

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
  };

  const validated = CustomerFormSchema.safeParse(raw);

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to create customer.',
      values: {
        name: String(raw.name ?? ''),
        email: String(raw.email ?? ''),
      },
    };
  }

  const imageResult = await resolveCustomerImage(formData);
  if (!imageResult.ok) return imageResult.state;
  const { image_url } = imageResult;

  try {
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${validated.data.name}, ${validated.data.email}, ${image_url})
    `;
  } catch (error: any) {
    if (error?.code === '23505') {
      return {
        errors: { email: [CustomerErrorCode.EMAIL_TAKEN] },
        errorCodes: [CustomerErrorCode.EMAIL_TAKEN],
        message: CustomerErrorCode.EMAIL_TAKEN,
        values: {
          name: validated.data.name,
          email: validated.data.email,
          image_url,
        },
      };
    }

    console.error(error);
    return {
      errors: {},
      errorCodes: [CustomerErrorCode.DATABASE_ERROR],
      message: CustomerErrorCode.DATABASE_ERROR,
      values: {
        name: validated.data.name,
        email: validated.data.email,
        image_url,
      },
    };
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function updateCustomer(
  id: string,
  prevState: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
  };

  const validated = CustomerFormSchema.safeParse(raw);

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to update customer.',
      values: {
        name: String(raw.name ?? ''),
        email: String(raw.email ?? ''),
      },
    };
  }

  const currentRows = await sql`
    SELECT image_url FROM customers WHERE id = ${id}
  `;
  const fallbackImageUrl =
    (currentRows[0]?.image_url as string | undefined) ?? null;

  const imageResult = await resolveCustomerImage(formData, {
    fallbackImageUrl,
  });
  if (!imageResult.ok) return imageResult.state;
  const { image_url } = imageResult;

  try {
    await sql`
      UPDATE customers
      SET name = ${validated.data.name},
          email = ${validated.data.email},
          image_url = ${image_url}
      WHERE id = ${id}
    `;
  } catch (error: any) {
    if (error?.code === '23505') {
      return {
        errors: { email: [CustomerErrorCode.EMAIL_TAKEN] },
        errorCodes: [CustomerErrorCode.EMAIL_TAKEN],
        message: CustomerErrorCode.EMAIL_TAKEN,
        values: {
          name: validated.data.name,
          email: validated.data.email,
          image_url,
        },
      };
    }

    console.error(error);
    return {
      errors: {},
      errorCodes: [CustomerErrorCode.DATABASE_ERROR],
      message: CustomerErrorCode.DATABASE_ERROR,
      values: {
        name: validated.data.name,
        email: validated.data.email,
        image_url,
      },
    };
  }

  const returnToRaw = formData.get('returnTo');
  const returnTo =
    typeof returnToRaw === 'string' &&
    returnToRaw.startsWith('/dashboard/customers')
      ? returnToRaw
      : '/dashboard/customers';

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/customers');
  revalidatePath(`/dashboard/customers/${id}`);
  redirect(returnTo);
}

/** Called from client onClick (not form action) — may return { success, message } */
export async function deleteCustomer(id: string) {
  const pending = await sql`
    SELECT COUNT(*)::int AS count
    FROM invoices
    WHERE customer_id = ${id} AND status = 'pending'
  `;

  const pendingCount = pending[0]?.count ?? 0;

  if (pendingCount > 0) {
    return {
      success: false as const,
      message: `Cannot delete this customer. They still have ${pendingCount} pending invoice${
        pendingCount === 1 ? '' : 's'
      }.`,
    };
  }

  try {
    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO customers_history (id, name, email, image_url)
        SELECT id, name, email, image_url
        FROM customers
        WHERE id = ${id}
      `;

      await tx`
        INSERT INTO invoices_history (id, customer_id, amount, status, date)
        SELECT id, customer_id, amount, status, date
        FROM invoices
        WHERE customer_id = ${id}
      `;

      await tx`
        DELETE FROM invoices
        WHERE customer_id = ${id}
      `;

      await tx`
        DELETE FROM customers
        WHERE id = ${id}
      `;
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return {
      success: false as const,
      message: 'Database Error: Failed to delete customer.',
    };
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/customers');
  return { success: true as const };
}