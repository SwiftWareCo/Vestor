import { AuthView } from '@neondatabase/auth/react';

export const dynamicParams = false;

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md">
        <AuthView path={path} />
      </div>
    </main>
  );
}