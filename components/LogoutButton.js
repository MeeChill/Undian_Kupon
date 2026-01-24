'use client'
import { logout } from '@/app/login/actions';

export default function LogoutButton() {
  return (
    <button 
        onClick={() => logout()} 
        style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer', 
            textDecoration: 'underline',
            fontSize: '1rem',
            marginLeft: '15px'
        }}
    >
      Keluar
    </button>
  );
}
