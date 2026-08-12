"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  QrCode,
  ChevronDown,
  ChevronRight,
  Package,
  FileText,
  Lock,
  ArrowRightLeft,
  Boxes,
  Truck,
  RotateCcw,
  Sliders,
  History,
  Activity,
  UserCheck,
  Split,
  Search,
  Sparkles,
  Building
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { can } from '@/lib/permissions';

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
  isCollapsible?: boolean;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    category: 'Main Menu',
    isCollapsible: false,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' }
    ]
  },
  {
    category: 'Master',
    isCollapsible: true,
    items: [
      { href: '/companies', label: 'Company Master', icon: Building2, permission: ['company:view', 'settings:view'] },
      { href: '/branches', label: 'Branch Master', icon: GitBranch, permission: ['branch:view', 'settings:view'] },
      { href: '/sites', label: 'Site Master', icon: MapPin, permission: ['site:view', 'settings:view'] },
      { href: '/warehouses', label: 'Warehouse Master', icon: Warehouse, permission: ['warehouse:view', 'settings:view'] },
      { href: '/warehouses/types', label: 'Warehouse Types', icon: Building, permission: ['warehouse:view', 'settings:view'] },
      { href: '/rooms', label: 'Rooms Master', icon: Layers, permission: ['storage:view', 'settings:view'] },
      { href: '/rows', label: 'Rows Master', icon: Layers, permission: ['storage:view', 'settings:view'] },
      { href: '/racks', label: 'Racks Master', icon: Layers, permission: ['storage:view', 'settings:view'] },
      { href: '/rack-templates', label: 'Rack Templates', icon: Sparkles, permission: ['storage:view', 'settings:view'] },
      { href: '/levels', label: 'Levels Master', icon: Layers, permission: ['storage:view', 'settings:view'] },
      { href: '/locations', label: 'Location Master', icon: MapPin, permission: ['storage:view', 'settings:view'] },
      { href: '/box-types', label: 'Box Types Master', icon: Package, permission: ['box:view', 'settings:view'] },
      { href: '/file-types', label: 'File Types Master', icon: FileText, permission: ['file:view', 'settings:view'] },
      { href: '/boxes', label: 'Box Master', icon: Package, permission: ['box:view', 'settings:view'] },
      { href: '/file-records', label: 'File Master', icon: FileText, permission: ['file:view', 'settings:view'] },
      { href: '/departments', label: 'Departments Master', icon: Building2, permission: ['settings:view'] },
      { href: '/vendors', label: 'Vendors Master', icon: Users, permission: ['settings:view'] },
      { href: '/clients', label: 'Client Master', icon: Users, permission: ['client:view', 'settings:view'] },
      { href: '/barcodes/master', label: 'Barcode Master', icon: QrCode, permission: ['settings:view', 'box:manage'] },
      { href: '/status-master', label: 'Status Master', icon: Activity, permission: ['settings:view'] },
      { href: '/work-orders', label: 'Work Orders', icon: Sliders, permission: ['workflow:execute', 'report:view'] },
      { href: '/inventory-movements', label: 'Inventory Movements', icon: ArrowRightLeft, permission: ['report:view', 'box:manage'] },
      { href: '/users', label: 'User Master', icon: UserCheck, permission: ['user:view', 'settings:view'] },
      { href: '/roles', label: 'Role Master', icon: Shield, permission: ['role:view', 'settings:view'] }
    ]
  },
  {
    category: 'Operations',
    isCollapsible: true,
    items: [
      { href: '/workflows/fresh-box-move', label: 'Fresh Box Storage', icon: Boxes, permission: ['workflow:execute', 'box:manage'] },
      { href: '/workflows/segregation', label: 'Fresh Pickup', icon: Truck, permission: ['workflow:execute', 'report:view'] },
      { href: '/workflows/refile', label: 'Refile Service', icon: RotateCcw, permission: ['workflow:execute', 'report:view'] },
      { href: '/workflows/merge', label: 'Merge / Split', icon: Split, permission: ['workflow:execute', 'report:view'] },
      { href: '/workflows/inventory-verification', label: 'Inventory Audit', icon: ClipboardList, permission: ['report:view', 'audit:view'] },
      { href: '/workflows/transfer', label: 'Work Orders', icon: Sliders, permission: ['workflow:execute', 'report:view'] }
    ]
  },
  {
    category: 'Analytics & Reports',
    isCollapsible: true,
    items: [
      { href: '/reports', label: 'Reports Dashboard', icon: BarChart3, permission: 'report:view' },
      { href: '/audit-logs', label: 'Activity Logs', icon: ScrollText, permission: 'audit:view' },
      { href: '/devices', label: 'Scanner Devices', icon: Smartphone, permission: 'device:view' },
      { href: '/sync', label: 'Sync History', icon: History, permission: 'sync:manage' }
    ]
  },
  {
    category: 'System Config',
    isCollapsible: true,
    items: [
      { href: '/settings', label: 'System Settings', icon: Settings, permission: 'settings:view' }
    ]
  }
];

function isActiveRoute(pathname: string, href: string): boolean {
  const cleanHref = href.split('#')[0];
  if (cleanHref === '/dashboard') {
    return pathname === cleanHref;
  }
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

function itemVisible(item: NavItem, user: any): boolean {
  if (!user) return false;
  const roleName = user?.roleName || user?.role?.name || user?.role;
  if (roleName === 'SUPER_ADMIN') return true;
  if (!item.permission) return true;
  const permissions = Array.isArray(item.permission) ? item.permission : [item.permission];
  return permissions.some((permission) => can(permission, user) || can('settings:view', user));
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'Master Modules': false,
    Operations: false,
    'Analytics & Reports': false,
    'System Config': false
  });

  // Auto expand active section
  useEffect(() => {
    NAV_SECTIONS.forEach((section) => {
      if (section.isCollapsible) {
        const hasActiveChild = section.items.some((item) => isActiveRoute(pathname, item.href));
        if (hasActiveChild) {
          setCollapsedSections((prev) => ({ ...prev, [section.category]: false }));
        }
      }
    });
  }, [pathname]);

  const toggleSection = (category: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Filter items by quick search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return NAV_SECTIONS;
    const q = searchQuery.toLowerCase();
    return NAV_SECTIONS.map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => item.label.toLowerCase().includes(q))
    })).filter((sec) => sec.items.length > 0);
  }, [searchQuery]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-screen w-68 flex-col
          border-r border-slate-200/80 bg-white shadow-xl shadow-slate-200/50
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header Branding */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 bg-gradient-to-r from-slate-50/80 to-white">
          <Link href="/dashboard" className="group flex items-center gap-3" onClick={onClose}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/25 transition-transform duration-300 group-hover:scale-105">
              <QrCode className="h-5.5 w-5.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                RMS <span className="text-blue-600 font-black">PRO</span>
              </span>
              <span className="mt-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Records Master
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Search Bar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-7 rounded-xl border border-slate-200/90 bg-white text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-4 overflow-y-auto p-3 text-xs">
          {filteredSections.map((section) => {
            const visibleItems = section.items.filter((item) => itemVisible(item, user));
            if (visibleItems.length === 0) return null;

            const isCollapsed = collapsedSections[section.category] && !searchQuery.trim();
            const hasActiveChild = visibleItems.some((item) => isActiveRoute(pathname, item.href));

            if (!section.isCollapsible) {
              return (
                <div key={section.category} className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveRoute(pathname, item.href);
                    return (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        onClick={onClose}
                        className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                          active
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {active && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={section.category} className="space-y-1">
                {/* Collapsible Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.category)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold uppercase tracking-wider transition-colors ${
                    hasActiveChild ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] tracking-wider">{section.category}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500">
                      {visibleItems.length}
                    </span>
                  </div>
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform" />
                  )}
                </button>

                {/* Section Items */}
                {!isCollapsed && (
                  <div className="ml-1 space-y-1 border-l-2 border-slate-100 pl-2">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActiveRoute(pathname, item.href);
                      return (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={onClose}
                          className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                            active
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-400'}`} />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {active && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs"></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer Card */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-slate-800 truncate">
                {user?.fullName || user?.username || 'Administrator'}
              </span>
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                {user?.roleName || user?.role || 'SUPER_ADMIN'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
