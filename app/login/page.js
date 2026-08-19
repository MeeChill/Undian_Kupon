'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        backgroundColor: pending ? '#93c5fd' : '#2563eb',
        color: 'white',
        padding: '0.5rem',
        borderRadius: '4px',
        border: 'none',
        cursor: pending ? 'wait' : 'pointer',
        fontWeight: '500',
      }}
    >
      {pending ? 'Memproses...' : 'Masuk'}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [state, action] = useFormState(login, { success: false, error: '', redirectTo: null });

  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [state?.success, state?.redirectTo, router]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
      <form action={action} style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '320px' }}>
        <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>Login Sistem</h1>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Username</label>
          <input
            name="username"
            type="text"
            autoComplete="username"
            placeholder="admin / scanner"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="******"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
          />
        </div>

        {state?.error && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{state.error}</p>
        )}

        {state?.success && !state?.error && (
          <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
            Login berhasil, mengarahkan...
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
