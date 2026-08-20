"use client";

import { ColumnDef } from '@tanstack/react-table';
import { RecordFile } from '@/lib/api/records';
import { FileStatusBadge } from '@/components/records/status-badge';
import { VisualBarcode } from '@/components/records/visual-barcode';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, FileText, Box as BoxIcon, Building2 } from 'lucide-react';

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

export const columns: ColumnDef<RecordFile>[] = [
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
    accessorKey: 'barcode',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Barcode</span>,
    cell: ({ row, table }) => {
      const file = row.original;
      const barcode = file.barcode || 'Unknown Barcode';
      const initials = getInitials(file.label || barcode);
      const style = getAvatarGradient(file.label || barcode);
      const meta = table.options.meta as any;

      return (
        <div 
          className="flex items-center gap-3.5 py-1.5 cursor-pointer group"
          onClick={() => meta?.onCustomAction?.(file)}
        >
          <div
            className="flex items-center justify-center w-10 h-10 rounded-2xl text-xs font-bold tracking-wider shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md shrink-0"
            style={{ 
              background: style.background, 
              color: style.color,
              border: style.border
            }}
          >
            {initials || <FileText className="w-4 h-4" />}
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="font-mono font-bold text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors duration-200">
              {barcode}
            </span>
            <VisualBarcode code={barcode} width={130} height={20} showText={false} />
            {file.label && (
              <span className="text-[11px] text-slate-500 font-semibold">
                {file.label}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Status</span>,
    cell: ({ row }) => <FileStatusBadge status={row.original.status} />,
  },
  {
    id: 'box',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Current Box</span>,
    cell: ({ row }) => {
      const boxBarcode = row.original.box?.barcode;
      return (
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
          <BoxIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          {boxBarcode ? (
            <a
              href={`/boxes?search=${encodeURIComponent(boxBarcode)}`}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200/80 hover:bg-blue-100 transition-colors"
            >
              {boxBarcode}
            </a>
          ) : (
            <span className="text-slate-400 font-normal italic">Unassigned</span>
          )}
        </div>
      );
    },
  },
  {
    id: 'client',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Client</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
        <Building2 className="w-3.5 h-3.5 text-slate-400" />
        {row.original.client?.name || '—'}
      </div>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Updated</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        {new Date(row.original.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
      </div>
    ),
  },
];
