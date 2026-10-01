'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    UserCircleIcon,
    AtSymbolIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { updateCustomer, CustomerState } from '@/app/lib/actions';
import { useActionState, useEffect } from 'react';
import { FormattedCustomersTable } from '@/app/lib/definitions';
import Modal from '@/app/ui/modal';
import {
    CustomerErrorCode,
    customerErrorMessages,
} from '@/app/lib/customer-errors';

function getErrorText(
    codeOrMessage: string | undefined,
    values?: { email?: string; name?: string },
) {
    if (!codeOrMessage) return null;

    // If it's a known code → use the mapped message
    if (codeOrMessage in customerErrorMessages) {
        return customerErrorMessages[codeOrMessage as CustomerErrorCode](values);
    }

    // Fallback for unknown / legacy messages
    return codeOrMessage;
}

export default function EditCustomerForm({
    customer,
    existingAvatars,
    returnTo,
}: {
    customer: FormattedCustomersTable;
    existingAvatars: string[];
    returnTo: string;
}) {
    const initialState: CustomerState = { message: null, errors: {} };
    const updateCustomerWithId = updateCustomer.bind(null, customer.id);
    const [state, formAction, isPending] = useActionState(updateCustomerWithId, initialState);

    const [mode, setMode] = useState<'existing' | 'upload'>('existing');
    const [preview, setPreview] = useState<string | null>(null);
    const [errorModalOpen, setErrorModalOpen] = useState(false);

    // Local errors for on-blur validation
    const [clientErrors, setClientErrors] = useState<{
        name?: string;
        email?: string;
    }>({});

    function validateName(value: string) {
        if (!value.trim()) return 'Please enter a name.';
        if (value.length > 100) return 'Name is too long.';
        return undefined;
    }

    function validateEmail(value: string) {
        if (!value.trim()) return 'Please enter an email.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Please enter a valid email address.';
        }
        return undefined;
    }

    function handleNameBlur(e: React.FocusEvent<HTMLInputElement>) {
        const error = validateName(e.target.value);
        setClientErrors((prev) => ({ ...prev, name: error }));
    }

    function handleEmailBlur(e: React.FocusEvent<HTMLInputElement>) {
        const error = validateEmail(e.target.value);
        setClientErrors((prev) => ({ ...prev, email: error }));
    }

    // Prefer server error if present, otherwise show client error
    const nameError =
        state.errors?.name?.[0]/* map code to text if you use codes */ ||
        clientErrors.name;

    const emailError =
        state.errors?.email?.[0] ||
        clientErrors.email;

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(null);
        }
    }
    // useEffect(() => {
    //     if (state.message) {
    //         setErrorModalOpen(true);
    //     }
    // }, [state.message]);
    useEffect(() => {
        if (!isPending && state.message) {
            setErrorModalOpen(true);
        }
    }, [isPending, state.message]);

    return (
        <>
            <form action={formAction}>
            <input type="hidden" name="returnTo" value={returnTo} />
                <div className="rounded-md bg-gray-50 p-4 md:p-6">
                    {/* Name */}
                    <div className="mb-4">
                        <label htmlFor="name" className="mb-2 block text-sm font-medium">
                            Customer name
                        </label>
                        <div className="relative">
                            <input
                                id="name"
                                name="name"
                                type="text"
                                defaultValue={customer.name}
                                onBlur={handleNameBlur}
                                onChange={() =>
                                    setClientErrors((prev) => ({ ...prev, name: undefined }))
                                }
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                aria-describedby="name-error"
                            />
                            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                        </div>
                        <div id="name-error" aria-live="polite" aria-atomic="true">
                            {nameError && (
                                <p className="mt-2 text-sm text-red-500">{nameError}</p>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="mb-4">
                        <label htmlFor="email" className="mb-2 block text-sm font-medium">
                            Email
                        </label>
                        <div className="relative">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={customer.email}
                                onBlur={handleEmailBlur}
                                onChange={() =>
                                    setClientErrors((prev) => ({ ...prev, email: undefined }))
                                }
                                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                aria-describedby="email-error"
                            />
                            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                        </div>
                        <div id="email-error" aria-live="polite" aria-atomic="true">
                            {emailError && (
                                <p className="mt-2 text-sm text-red-500">{emailError}</p>
                            )}
                        </div>
                    </div>

                    {/* Avatar – same dual-mode UI as create */}
                    <fieldset className="mb-4">
                        <legend className="mb-2 block text-sm font-medium">Avatar</legend>

                        <div className="mb-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('existing');
                                    setPreview(null);
                                }}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'existing'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Choose existing
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('upload')}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium ${mode === 'upload'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Upload new
                            </button>
                        </div>

                        {mode === 'existing' && (
                            <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                                {existingAvatars.map((src) => (
                                    <label
                                        key={src}
                                        className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-gray-200 p-2 hover:bg-gray-100 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                                    >
                                        <input
                                            type="radio"
                                            name="image_url"
                                            value={src}
                                            className="sr-only"
                                            defaultChecked={src === customer.image_url}
                                        />
                                        <Image
                                            src={src}
                                            alt="Customer avatar"
                                            width={48}
                                            height={48}
                                            className="rounded-full"
                                        />
                                    </label>
                                ))}
                            </div>
                        )}

                        {mode === 'upload' && (
                            <div className="flex flex-col items-start gap-3">
                                <label
                                    htmlFor="avatar"
                                    className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:bg-gray-100"
                                >
                                    <PhotoIcon className="h-5 w-5" />
                                    <span>Select image (PNG / JPG)</span>
                                </label>
                                <input
                                    id="avatar"
                                    name="avatar"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                {preview && (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="mt-2 h-16 w-16 rounded-full object-cover"
                                    />
                                )}
                            </div>
                        )}

                        <div id="image_url-error" aria-live="polite" aria-atomic="true">
                            {state.errors?.image_url?.map((error) => (
                                <p className="mt-2 text-sm text-red-500" key={error}>
                                    {error}
                                </p>
                            ))}
                        </div>
                    </fieldset>

                    {state.message && (
                        <p className="mt-2 text-sm text-red-500">{state.message}</p>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <Link
                        href={returnTo}
                        className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                    >
                        Cancel
                    </Link>
                    <Button type="submit">Edit Customer</Button>
                </div>
            </form>
            {/* Extra modal for stronger feedback */}
            <Modal
                open={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                title="Cannot save customer"
                footer={
                    <button
                        type="button"
                        onClick={() => setErrorModalOpen(false)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                    >
                        OK
                    </button>
                }
            >
                <p>{getErrorText(state.message ?? state.errorCodes?.[0], state.values)}</p>
            </Modal>
        </>
    );
}