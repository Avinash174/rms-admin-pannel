import { ColumnDef } from '@tanstack/react-table';
import { OperationSummary } from '@/lib/api/operations';
import { User } from 'lucide-react';

export const columns: ColumnDef<OperationSummary>[] = [
  {
    accessorKey: 'performedAt',
    header: 'Date',
    cell: ({ row }) => (
      <span className="text-xs text-slate-600">
        {new Date(row.original.performedAt).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: 'boxBarcode',
    header: 'Box',
    cell: ({ row, table }) => {
      const item = row.original;
      const meta = table.options.meta as any;
      return (
        <button
          className="font-mono text-sm font-semibold text-slate-800 hover:text-blue-600"
          onClick={() => meta?.onCustomAction?.(item)}
        >
          {item.boxBarcode || '—'}
        </button>
      );
    },
  },
  {
    id: 'user',
    header: 'User',
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-xs text-slate-700">
        <User className="w-3.5 h-3.5 text-slate-400" />
        {row.original.user.fullName}
      </div>
    ),
  },
  {
    accessorKey: 'warehouseName',
    header: 'Warehouse',
    cell: ({ row }) => <span className="text-sm">{row.original.warehouseName || '—'}</span>,
  },
  {
    accessorKey: 'verifiedCount',
    header: 'Verified',
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-emerald-700">{row.original.verifiedCount ?? 0}</span>
    ),
  },
  {
    accessorKey: 'missingCount',
    header: 'Missing',
    cell: ({ row }) => {
      const count = row.original.missingCount ?? 0;
      return (
        <span
          className={`text-sm font-semibold ${count > 0 ? 'text-rose-600' : 'text-slate-400'}`}
        >
          {count}
        </span>
      );
    },
  },
  {
    accessorKey: 'warningsCount',
    header: 'Warnings',
    cell: ({ row }) => {
      const count = row.original.warningsCount ?? 0;
      return (
        <span
          className={`text-sm font-semibold ${count > 0 ? 'text-amber-600' : 'text-slate-400'}`}
        >
          {count}
        </span>
      );
    },
  },
];
