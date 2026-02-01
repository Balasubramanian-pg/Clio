import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', color?: string }> = ({ size = 'md', color = 'border-casper' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${color} border-t-transparent rounded-full animate-spin`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};