'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import HeroPage from '@/components/HeroPage';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/app');
    }
  }, [status, router]);

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated') {
    return null;
  }

  return <HeroPage />;
}
