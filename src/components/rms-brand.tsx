import Image from 'next/image';
import { cn } from '@/lib/utils';

type RmsBrandProps = {
  variant?: 'login' | 'sidebar';
  showTagline?: boolean;
  className?: string;
};

export function RmsBrand({
  variant = 'login',
  showTagline = true,
  className
}: RmsBrandProps) {
  const isLogin = variant === 'login';

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/25',
          isLogin ? 'h-20 w-20 rounded-[22px]' : 'h-9 w-9 rounded-xl shadow-md shadow-blue-500/20'
        )}
      >
        <Image
          src="/rms-logo.png"
          alt="RMS logo"
          width={isLogin ? 80 : 36}
          height={isLogin ? 80 : 36}
          priority={isLogin}
          className={cn('object-cover', isLogin ? 'h-20 w-20' : 'h-9 w-9')}
        />
      </div>

      <div className={cn('mt-4', !isLogin && 'mt-0 ml-2.5 text-left')}>
        <h1
          className={cn(
            'font-black uppercase tracking-wider text-slate-900',
            isLogin ? 'text-3xl' : 'text-sm leading-none'
          )}
        >
          RMS
          {!isLogin && <span className="text-blue-600"> Admin</span>}
        </h1>
        {showTagline && isLogin && (
          <p className="mt-2 text-sm font-semibold tracking-wide text-blue-600/90">
            Records Management System
          </p>
        )}
        {!isLogin && showTagline && (
          <span className="mt-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Control Panel
          </span>
        )}
      </div>
    </div>
  );
}
