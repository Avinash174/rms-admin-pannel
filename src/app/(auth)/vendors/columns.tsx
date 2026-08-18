import { ColumnDef } from '@tanstack/react-table';
import { Vendor } from '@/lib/types/vendor';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Edit,
  Eye,
  MoreHorizontal,
  Power,
  Trash2,
  Mail,
  Phone
} from 'lucide-react';

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${h1}, 80%, 92%) 0%, hsl(${h2}, 85%, 85%) 100%)`,
    color: `hsl(${h1}, 90%, 30%)`,
    border: `1px solid hsl(${h1}, 70%, 80%)`,
  };
}

function getInitials(name: string) {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const columns: ColumnDef<Vendor>[] = [
  {
    accessorKey: 'name',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Vendor Name</span>,
    cell: ({ row, table }) => {
      const vendor = row.original;
      const name = vendor.name || 'Unknown Vendor';
      const initials = getInitials(name);
      const style = getAvatarGradient(name);
      const meta = table.options.meta as any;

      return (
        <div
          className="flex items-center gap-3.5 py-1.5 cursor-pointer group"
          onClick={() => meta?.onCustomAction?.(vendor)}
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl text-xs font-bold tracking-wider shadow-xs transition-all duration-300 group-hover:scale-105"
            style={{
              background: style.background,
              color: style.color,
              border: style.border
            }}
          >
            {initials || <Building2 className="w-4 h-4" />}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors duration-200">
              {name}
            </span>
            {vendor.company?.name && (
              <span className="text-[11px] text-slate-400 font-medium">
                {vendor.company.name}
              </span>
            )}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'code',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Vendor Code</span>,
    cell: ({ row }) => (
      <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-700 font-mono text-xs font-bold uppercase tracking-wide">
        {row.original.code}
      </div>
    )
  },
  {
    accessorKey: 'contactEmail',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Contact Email</span>,
    cell: ({ row }) => {
      const email = row.original.contactEmail;
      if (!email) return <span className="text-xs text-slate-400">-</span>;
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-650 font-medium">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[180px]">{email}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'phone',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Phone</span>,
    cell: ({ row }) => {
      const phone = row.original.phone;
      if (!phone) return <span className="text-xs text-slate-400">-</span>;
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-650 font-medium">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{phone}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'address',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Address</span>,
    cell: ({ row }) => (
      <span className="text-xs text-slate-600 truncate max-w-[160px] block" title={row.original.address || ''}>
        {row.original.address || '-'}
      </span>
    )
  },
  {
    accessorKey: 'isActive',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Status</span>,
    cell: ({ row, table }) => {
      const vendor = row.original;
      const meta = table.options.meta as any;
      const isActive = vendor.isActive;

      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            meta?.onEdit?.({ ...vendor, isActive: !isActive }, true);
          }}
          className={`group flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 border ${
            isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          </span>
          {isActive ? 'Active' : 'Inactive'}
        </button>
      );
    }
  },
  {
    accessorKey: 'createdAt',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Created Date</span>,
    cell: ({ row }) => (
      <span className="text-xs text-slate-500">
        {row.original.createdAt ? format(new Date(row.original.createdAt), 'dd MMM yyyy') : '-'}
      </span>
    )
  },
  {
    id: 'actions',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Actions</span>,
    cell: ({ row, table }) => {
      const vendor = row.original;
      const meta = table.options.meta as any;
      const isActive = vendor.isActive;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-lg p-0 hover:bg-slate-100">
              <MoreHorizontal className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 shadow-lg">
            <DropdownMenuLabel className="text-xs font-normal text-slate-400">Vendor Actions</DropdownMenuLabel>
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs" onClick={() => meta?.onCustomAction?.(vendor)}>
              <Eye className="h-4 w-4 text-blue-600" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 text-xs" onClick={() => meta?.onEdit?.(vendor)}>
              <Edit className="h-4 w-4 text-indigo-600" /> Edit Vendor
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs"
              onClick={() => meta?.onEdit?.({ ...vendor, isActive: !isActive }, true)}
            >
              <Power className={`h-4 w-4 ${isActive ? 'text-amber-600' : 'text-emerald-600'}`} />
              {isActive ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs font-semibold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
              onClick={() => meta?.onDelete?.(vendor)}
            >
              <Trash2 className="h-4 w-4 text-rose-600" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
