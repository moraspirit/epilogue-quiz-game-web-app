'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LevelsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quiz');
  }, [router]);

  return null;
}
