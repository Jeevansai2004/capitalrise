import React from 'react';

export default function Input({ label, error, className = '', name, ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <input
        name={name}
        {...props}
        className={`input ${error ? 'border-danger-500' : ''}`}
      />
      {error && <p className="text-danger-600 text-xs mt-1">{error}</p>}
    </div>
  );
} 