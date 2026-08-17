"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getDefaultLandingPath } from '@/lib/route-permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RmsBrand } from '@/components/rms-brand';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getDefaultLandingPath(user));
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Email and password are required.');
      }

      // Call auth context login which calls real backend API and handles storage
      const session = await login({ email, password });

      const isEnterpriseAdmin =
        session.user.roleName === 'SUPER_ADMIN' ||
        session.user.roleName === 'COMPANY_ADMIN' ||
        session.user.roleName?.includes('SUPER');

      if (!isEnterpriseAdmin && (!session.warehouse || !session.warehouse.id)) {
        await logout();
        setError('No warehouse has been assigned to your account. Please contact your system administrator.');
        return;
      }

      router.replace(getDefaultLandingPath(session.user));
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Cannot connect to the backend server. Please make sure the backend is running on port 3002 (cd backend && npm run dev).');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          <div className="mb-8 flex flex-col items-center">
            <RmsBrand variant="login" />
            <div className="mt-6 text-center">
              <h2 className="text-xl font-semibold text-slate-900">Welcome Back</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in to your RMS admin account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>Warehouse Administrator?</span>
            <Link
              href="/warehouse-login"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Warehouse Login &rarr;
            </Link>
          </div>

          <div className="mt-4 text-center text-sm text-slate-500">
            <p className="font-medium text-slate-600">Records Management System</p>
            <p className="text-xs text-slate-400 mt-1">RMS Admin Panel · v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
