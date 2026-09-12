'use client';

import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/language';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" />
      </AuthProvider>
    </LanguageProvider>
  );
}
