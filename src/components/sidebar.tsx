"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  LayoutDashboard,
  Users,
  Shield,
  Warehouse,
  FileBox,
  Settings,
  Building2,
  GitBranch,
  MapPin,
  Layers,
  ClipboardList,
  BarChart3,
  ScrollText,
  Smartphone,
  Database
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { can, isSuperAdmin } from '@/lib/permissions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string | string[];
};

type NavSection = {
  category: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    category: 'Operations',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' }
    ]
  },
  {
    category: 'Masters',
    items: [
      { href: '/companies', label: 'Company', icon: Building2, permission: 'settings:manage' },
      { href: '/branches', label: 'Branch', icon: GitBranch, permission: 'settings:view' },
      { href: '/warehouses', label: 'Warehouse', icon: Warehouse, permission: 'settings:view' },
      { href: '/sites', label: 'Site', icon: MapPin, permission: 'settings:view' },
      { href: '/rooms', label: 'Room', icon: Layers, permission: 'settings:view' },
      { href: '/racks', label: 'Rack', icon: Layers, permission: 'settings:view' },
      { href: '/shelves', label: 'Shelf', icon: Layers, permission: 'settings:view' },
      { href: '/locations', label: 'Location', icon: MapPin, permission: 'settings:view' },
      { href: '/clients', label: 'Client', icon: Users, permission: 'settings:view' }
    ]
  },
  {
    category: 'Access',
    items: [
      { href: '/users', label: 'Users', icon: Users, permission: 'user:view' },
      { href: '/roles', label: 'Roles', icon: Shield, permission: 'role:view' },
      { href: '/devices', label: 'Devices', icon: Smartphone, permission: 'device:view' }
    ]
  },
  {
    category: 'Records',
    items: [
      { href: '/boxes', label: 'Boxes', icon: FileBox, permission: 'box:view' },
      { href: '/file-records', label: 'Files', icon: FileBox, permission: 'file:view' },
      { href: '/barcodes', label: 'Barcodes', icon: Database, permission: 'box:manage' }
    ]
  },
  {
    category: 'Operations Review',
    items: [
      {
        href: '/workflows/inventory-verification',
        label: 'Inventory',
        icon: ClipboardList,
        permission: 'report:view'
      },
      { href: '/workflows/refile', label: 'Refile', icon: ClipboardList, permission: 'report:view' },
      { href: '/workflows/transfer', label: 'Transfer', icon: ClipboardList, permission: 'report:view' }
    ]
  },
  {
    category: 'Insight',
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3, permission: 'report:view' },
      { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText, permission: 'audit:view' }
    ]
  },
  {
    category: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings, permission: 'settings:view' }
    ]
  }
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function itemVisible(item: NavItem, user: any): boolean {
  if (!item.permission) return true;
  const permissions = Array.isArray(item.permission) ? item.permission : [item.permission];
  return permissions.some((permission) => can(permission, user));
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col
          border-r border-slate-200 bg-white
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 bg-slate-50/20 px-4">
          <Link href="/dashboard" className="group flex items-center gap-2.5" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
              <Database className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase leading-none tracking-wider text-slate-900">
                RMS <span className="text-blue-600">Admin</span>
              </span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Control Panel
              </span>
            </div>
          </Link>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-slate-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSuperAdmin(user) && user?.companyName && (
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company</p>
            <p className="truncate text-sm font-semibold text-slate-800">{user.companyName}</p>
          </div>
        )}

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => itemVisible(item, user));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.category}>
                <div className="mb-2 truncate px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.category}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveRoute(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      >
                        <Icon className={`mr-3 h-4 w-4 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">v1.0.0</div>
      </aside>
    </>
  );
}
