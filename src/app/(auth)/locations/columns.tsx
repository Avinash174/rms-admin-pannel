import { ColumnDef } from '@tanstack/react-table';
import { Location } from '@/lib/types/location';
import { Calendar, MapPin, Building2, Layers } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { VisualBarcode } from '@/components/records/visual-barcode';

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

export const columns: ColumnDef<Location>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'fullLocation2',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Location (NFull Location2)</span>,
    cell: ({ row, table }) => {
      const location = row.original;
      const displayCode = location.fullLocation2 || location.barcode || 'Unknown Location';
      const initials = getInitials(location.location || location.name || displayCode);
      const style = getAvatarGradient(displayCode);
      const meta = table.options.meta as any;

      return (
        <div 
          className="flex items-center gap-3.5 py-1.5 cursor-pointer group"
          onClick={() => meta?.onCustomAction?.(location)}
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-2xl text-xs font-bold tracking-wider shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-md shrink-0"
            style={{ 
              background: style.background, 
              color: style.color,
              border: style.border
            }}
          >
            {initials || <MapPin className="w-4 h-4" />}
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="font-mono font-bold text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors duration-200">
              {displayCode}
            </span>
            <VisualBarcode code={displayCode} width={130} height={18} showText={false} />
            {location.fullLocation && (
              <span className="text-[11px] text-slate-400 font-medium">
                Full: {location.fullLocation}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'row',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">NRow</span>,
    cell: ({ row }) => (
      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
        {row.original.row || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'rack',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">NRack2</span>,
    cell: ({ row }) => (
      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
        {row.original.rack || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'level',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Nlevel</span>,
    cell: ({ row }) => (
      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
        {row.original.level || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'location',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">NLocation</span>,
    cell: ({ row }) => (
      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
        {row.original.location || row.original.name || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'warehouseName',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Warehouse</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>{row.original.warehouseName || row.original.warehouse?.name || '-'}</span>
      </div>
    ),
  },
  {
    accessorKey: 'isOccupied',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Occupancy</span>,
    cell: ({ row }) => {
      const occupied = row.original.isOccupied ? 1 : 0;
      const capacity = row.original.capacity ?? 1;
      const percent = Math.round((occupied / capacity) * 100);
      return (
        <div className="min-w-[100px]">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>{occupied > 0 ? 'Occupied' : 'Empty'}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100">
            <div
              className={`h-1.5 rounded-full ${occupied > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Status</span>,
    cell: ({ row, table }) => {
      const location = row.original;
      const meta = table.options.meta as any;
      const isActive = row.getValue('isActive') as boolean;

      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            meta?.onEdit?.({ ...location, isActive: !isActive }, true);
          }}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 border ${
            isActive
              ? 'bg-emerald-50/60 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 shadow-xs'
              : 'bg-rose-50/60 text-rose-700 border-rose-200 hover:bg-rose-100/80 shadow-xs'
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
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Created At</span>,
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
