import * as React from "react"

const DropdownContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export interface DropdownMenuProps {
  children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const context = React.useContext(DropdownContext);
  if (!context) return <>{children}</>;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    context.setIsOpen(!context.isOpen);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        handleClick(e);
        if (children.props.onClick) {
          children.props.onClick(e);
        }
      }
    });
  }

  return (
    <div className="inline-block" onClick={handleClick}>
      {children}
    </div>
  );
}

export interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function DropdownMenuContent({ children, align = 'end', className }: DropdownMenuContentProps) {
  const context = React.useContext(DropdownContext);
  if (!context || !context.isOpen) return null;

  return (
    <div 
      className={`absolute right-0 mt-2 w-48 rounded-[14px] bg-white border border-slate-200 shadow-lg focus:outline-none z-50 ${align === 'start' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0'} ${className || ''}`}
      onClick={() => context.setIsOpen(false)}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-2 text-sm font-semibold text-slate-900 ${className || ''}`}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-slate-200 my-1" />
}

export interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export function DropdownMenuItem({ children, className, onClick }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 w-full text-left ${className || ''}`}
    >
      {children}
    </button>
  )
}
