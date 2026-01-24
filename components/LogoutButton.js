'use client'
import { logout } from '@/app/login/actions';

export default function LogoutButton() {
  return (
    <button 
        onClick={() => logout()} 
        className="btn btn-danger"
        style={{ 
            fontSize: '0.875rem',
            padding: '0.4rem 1rem'
        }}
    >
      Keluar
    </button>
  );
}
