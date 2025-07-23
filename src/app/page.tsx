import { HomeScreen } from '@/components/study/home-screen';
import { Suspense } from 'react';

export default function Home() {
  return (
    <main className="min-h-screen w-full">
      <Suspense>
        <HomeScreen />
      </Suspense>
    </main>
  );
}
