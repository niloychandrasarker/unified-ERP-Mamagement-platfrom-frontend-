'use client';

import React, { useState, useEffect } from 'react';

export default function CampusLogo({ logo, name, size = 'sm', className = '' }) {
  const [hasError, setHasError] = useState(false);
  
  let logoUrl = typeof logo === 'string' ? logo : (logo?.url || '');
  if (typeof logoUrl === 'string' && logoUrl.startsWith('{') && logoUrl.includes('"url"')) {
    try {
      logoUrl = JSON.parse(logoUrl).url || logoUrl;
    } catch (e) {}
  }
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  const sizeClasses = size === 'xl'
    ? 'w-16 h-16 rounded-2xl text-2xl'
    : size === 'lg'
    ? 'w-10 h-10 rounded-xl text-sm'
    : size === 'md'
    ? 'w-9 h-9 rounded-lg text-xs'
    : 'w-8 h-8 rounded-lg text-xs';

  if (!logoUrl || hasError) {
    return (
      <div className={`${sizeClasses} bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-black flex items-center justify-center shadow-sm shrink-0 select-none ${className}`}>
        {initial}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} bg-white border border-slate-200/80 p-0.5 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
      <img
        src={logoUrl}
        alt={name || 'Institution Logo'}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

