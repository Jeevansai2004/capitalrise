import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  className = '',
  size = 'md',
  ...props
}) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} ${sizeClasses[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="animate-spin mr-2">⏳</span>
      ) : null}
      {children}
    </button>
  );
} 