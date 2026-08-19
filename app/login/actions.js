'use server'

import { createSession, deleteSession, getScannerRtFromUsername } from '@/lib/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export async function login(prevState, formData) {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();

  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (user && user.password === password) {
    await createSession({
      id: user.id,
      username: user.username,
      role: user.role,
      rt: getScannerRtFromUsername(user.username),
    });

    return {
      success: true,
      error: '',
      redirectTo: user.role === 'admin' ? '/' : '/scan',
    };
  }

  return {
    success: false,
    error: 'Username atau password salah!',
    redirectTo: null,
  };
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
