'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createToken } from '@/lib/jwt'; 

export async function loginAdmin(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // Verifies against your .env file
  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return { error: 'Invalid admin credentials' };
  }

  // Generates the secure cookie token
  const jwt = await createToken({ role: 'admin' });

  const cookieStore = await cookies();
  cookieStore.set('admin_session', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Sends you to the dashboard
  redirect('/admin');
}