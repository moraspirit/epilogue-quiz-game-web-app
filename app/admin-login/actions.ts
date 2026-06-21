'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createToken } from '@/lib/jwt'; 
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function loginAdmin(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // Find admin user in the database
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || user.role !== 'ADMIN') {
    return { error: 'Invalid admin credentials' };
  }

  // Compare password using bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
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