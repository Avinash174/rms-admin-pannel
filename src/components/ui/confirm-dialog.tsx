import * as React from 'react';
import { AlertTriangle, Info, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  // Handle escape key to close dialog
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = {
    danger: {
      bg: 'bg-rose-50 border border-rose-100',
      iconColor: 'text-rose-600',
      Icon: AlertCircle,
      confirmButtonClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/10 focus:ring-rose-500',
    },
    warning: {
      bg: 'bg-amber-50 border border-amber-100',
      iconColor: 'text-amber-600',
      Icon: AlertTriangle,
      confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/10 focus:ring-amber-500',
    },
    info: {
      bg: 'bg-blue-50 border border-blue-100',
      iconColor: 'text-blue-600',
      Icon: Info,
      confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10 focus:ring-blue-500',
    },
  };

  const { bg, iconColor, Icon, confirmButtonClass } = config[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={isLoading ? undefined : onClose}
      />
      
      {/* Dialog container */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100/80 animate-in zoom-in-95 duration-200">
        
        {/* Content wrapper */}
        <div className="p-6 flex flex-col items-center text-center">
          
          {/* Accent icon */}
          <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${bg} mb-4`}>
            <Icon className={`w-7 h-7 ${iconColor}`} />
          </div>
          
          {/* Header */}
          <h3 className="text-lg font-extrabold text-slate-900 leading-snug tracking-tight mb-2">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            {description}
          </p>
        </div>
        
        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
            className="rounded-xl border-slate-200 text-slate-650 hover:bg-slate-100/55 transition-colors h-11 px-4 font-bold text-xs uppercase tracking-wider"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`rounded-xl h-11 px-5 font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center ${confirmButtonClass}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
