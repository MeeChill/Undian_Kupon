'use server'

import { createSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export async function login(prevState, formData) {
  const username = formData.get('username');
  const password = formData.get('password');

  // Verify user against database
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (user && user.password === password) {
    // Check password (In production use bcrypt/argon2 to verify hash)
    await createSession(user.username, user.role);

    // Redirect based on role
    if (user.role === 'admin') {
        redirect('/');
    } else {
        redirect('/scan');
    }
  }

  return {
    error: 'Username atau password salah!'
  };
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
