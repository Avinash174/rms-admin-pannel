import { ColumnDef } from '@tanstack/react-table';
import { Warehouse } from '@/lib/types/warehouse';
import { Building, Calendar, MapPin } from 'lucide-react';

// Highly curated, vibrant gradient configurations based on initials
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

export const columns: ColumnDef<Warehouse>[] = [
  {
    accessorKey: 'name',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Warehouse Name</span>,
    cell: ({ row, table }) => {
      const warehouse = row.original;
      const name = warehouse.name || 'Unknown Warehouse';
      const initials = getInitials(name);
      const style = getAvatarGradient(name);
      const meta = table.options.meta as any;

      return (
        <div 
          className="flex items-center gap-4 py-1.5 cursor-pointer group"
          onClick={() => meta?.onCustomAction?.(warehouse)} // triggers detail drawer
        >
          <div
            className="flex items-center justify-center w-11 h-11 rounded-2xl text-sm font-bold tracking-wider shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
            style={{ 
              background: style.background, 
              color: style.color,
              border: style.border
            }}
          >
            {initials || <Building className="w-5 h-5" />}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors duration-200">
              {name}
            </span>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5 select-all">
              ID: {warehouse.id}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'code',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Code</span>,
    cell: ({ row }) => (
      <div className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 font-mono text-xs font-bold uppercase tracking-widest shadow-sm">
        {row.getValue('code')}
      </div>
    ),
  },
  {
    accessorKey: 'siteName',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Site Assignment</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
        <MapPin className="w-3.5 h-3.5 text-slate-400" />
        {row.getValue('siteName') || 'Unassigned'}
      </div>
    ),
  },
  {
    accessorKey: 'city',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Location</span>,
    cell: ({ row }) => {
      const city = row.original.city;
      const state = row.original.state;
      const loc = [city, state].filter(Boolean).join(', ');
      return <div className="text-xs text-slate-500 font-medium">{loc || '-'}</div>;
    },
  },
  {
    accessorKey: 'isActive',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Status</span>,
    cell: ({ row, table }) => {
      const warehouse = row.original;
      const meta = table.options.meta as any;
      const isActive = row.getValue('isActive') as boolean;

      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            meta?.onEdit?.({ ...warehouse, isActive: !isActive }, true);
          }}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border ${
            isActive
              ? 'bg-emerald-50/60 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 shadow-sm shadow-emerald-500/5'
              : 'bg-rose-50/60 text-rose-700 border-rose-200 hover:bg-rose-100/80 shadow-sm shadow-rose-500/5'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {isActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </span>
          {isActive ? 'Active' : 'Inactive'}
        </button>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Created Date</span>,
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      );
    },
  },
];
