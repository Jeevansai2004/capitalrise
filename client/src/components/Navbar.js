import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="w-full bg-primary-600 text-white px-4 py-3 flex items-center justify-between shadow">
      <div className="font-bold text-xl tracking-wide">
        <a href={user?.role === 'admin' ? '/admin' : '/dashboard'}>Capital Rise</a>
      </div>
      <div className="flex items-center gap-4">
        {user && <span className="font-medium">{user.username} ({user.role})</span>}
        <button onClick={logout} className="btn btn-secondary text-primary-700">Logout</button>
      </div>
    </nav>
  );
} 