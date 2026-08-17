"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getDefaultLandingPath } from '@/lib/route-permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RmsBrand } from '@/components/rms-brand';
import { Eye, EyeOff, Warehouse, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WarehouseLoginPage() {
  const router = useRouter();
  const { login, logout, user, warehouse, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [noWarehouseAssigned, setNoWarehouseAssigned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (warehouse?.id) {
        router.replace('/dashboard');
      }
    }
  }, [authLoading, user, warehouse, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNoWarehouseAssigned(false);
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Email and password are required.');
      }

      const session = await login({ email, password });

      if (!session.warehouse || !session.warehouse.id) {
        setNoWarehouseAssigned(true);
        await logout();
        setError('No warehouse has been assigned to your account. Please contact your system administrator.');
        return;
      }

      router.replace('/dashboard');
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Cannot connect to backend server. Please verify backend service on port 3002.');
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-950/50 border border-white/20 p-8">
          <div className="mb-6 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 mb-4">
              <Warehouse className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Warehouse Portal
              </span>
            </div>
            <RmsBrand variant="login" />
            <div className="mt-4 text-center">
              <h2 className="text-xl font-bold text-slate-900">Warehouse Administrator Login</h2>
              <p className="mt-1 text-sm text-slate-500">Access your assigned warehouse management dashboard</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="warehouse.admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
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
                  autoComplete="current-password"
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold">{noWarehouseAssigned ? 'Access Denied' : 'Login Error'}</p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Warehouse'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span>Are you a Super Admin?</span>
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 hover:underline"
            >
              Super Admin Login <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
