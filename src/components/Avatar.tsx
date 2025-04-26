import React from 'react';

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ url, name, size = 'md' }: AvatarProps) {
  const sizeClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
    : '?';

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center ${sizeClass[size]}`}
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {url ? (
        <img src={url} alt={name || 'User avatar'} className="w-full h-full object-cover" />
      ) : (
        <div className="font-medium" style={{ color: 'var(--color-primary-foreground)' }}>
          {initials}
        </div>
      )}
    </div>
  );
} 