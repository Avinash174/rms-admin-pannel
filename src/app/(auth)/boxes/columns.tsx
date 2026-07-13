import { ColumnDef } from '@tanstack/react-table';
import { Box as BoxType } from '@/lib/types/box';
import { Calendar, Archive, FileText, MapPin } from 'lucide-react';

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

export const columns: ColumnDef<BoxType>[] = [
  {
    accessorKey: 'barcode',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Barcode</span>,
    cell: ({ row, table }) => {
      const box = row.original;
      const barcode = box.barcode || 'Unknown Barcode';
      const initials = getInitials(box.description || barcode);
      const style = getAvatarGradient(box.description || barcode);
      const meta = table.options.meta as any;

      return (
        <div 
          className="flex items-center gap-4 py-1.5 cursor-pointer group"
          onClick={() => meta?.onCustomAction?.(box)}
        >
          <div
            className="flex items-center justify-center w-11 h-11 rounded-2xl text-xs font-bold tracking-wider shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
            style={{ 
              background: style.background, 
              color: style.color,
              border: style.border
            }}
          >
            {initials || <Archive className="w-5 h-5" />}
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors duration-200">
              {barcode}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {box.description || 'No Description'}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'clientName',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Client / Dept</span>,
    cell: ({ row }) => {
      const box = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-800 font-semibold">{box.clientName || '-'}</span>
          <span className="text-[10px] text-slate-450 font-semibold">{box.departmentName || '-'}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'locationName',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Storage Location</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl w-fit">
        <MapPin className="w-3.5 h-3.5 text-slate-450" />
        {row.getValue('locationName') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'year',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Year</span>,
    cell: ({ row }) => (
      <div className="text-xs font-mono text-slate-800 font-bold">
        {row.getValue('year')}
      </div>
    ),
  },
  {
    accessorKey: 'fileCount',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">File Count</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-650 font-semibold">
        <FileText className="w-4 h-4 text-slate-400" />
        {row.getValue('fileCount')} files
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Status</span>,
    cell: ({ row, table }) => {
      const box = row.original;
      const meta = table.options.meta as any;
      const status = row.getValue('status') as string;
      const isActive = status === 'ACTIVE';

      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const nextStatus = isActive ? 'IN_TRANSIT' : 'ACTIVE';
            meta?.onEdit?.({ ...box, status: nextStatus }, true);
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
          {isActive ? 'In Warehouse' : 'Checked Out'}
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
