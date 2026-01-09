'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else if (res.status === 401) {
          // Not authenticated, middleware should have redirected, but as fallback:
          router.push('/login');
        } else {
          const errorData = await res.json();
          setError(errorData.error || 'Failed to fetch user data');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Network error or unexpected issue');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        router.push('/login');
      } else {
        const data = await res.json();
        setError(data.error || 'Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('An unexpected error occurred during logout.');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading user data...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center text-red-600">Error: {error}</div>;
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center">Not authenticated. Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="flex justify-between items-center py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
          Logout
        </Button>
      </header>
      <main className="mt-8">
        <h2 className="text-xl font-medium text-gray-700">Welcome, {user.name || user.email}!</h2>
        <p className="text-gray-600 mt-2">Your role: {user.role}</p>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-700">Your Projects</h3>
          <p className="text-gray-500 mt-2">View and manage your projects here.</p>
          <Button onClick={() => router.push('/app/projects')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
            Go to Projects
          </Button>
        </div>
      </main>
    </div>
  );
}
