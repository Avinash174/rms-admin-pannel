import { ColumnDef } from '@tanstack/react-table';
import { OperationSummary } from '@/lib/api/operations';
import { ArrowRight, User } from 'lucide-react';

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
    id: 'boxes',
    header: 'Boxes',
    cell: ({ row, table }) => {
      const item = row.original;
      const meta = table.options.meta as any;
      return (
        <button
          className="flex items-center gap-2 font-mono text-xs font-semibold hover:text-blue-600"
          onClick={() => meta?.onCustomAction?.(item)}
        >
          <span>{item.oldBoxBarcode}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.newBoxBarcode}</span>
        </button>
      );
    },
  },
  {
    accessorKey: 'outCount',
    header: 'Out',
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-slate-700">{row.original.outCount ?? 0}</span>
    ),
  },
  {
    accessorKey: 'inCount',
    header: 'In',
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-slate-700">{row.original.inCount ?? 0}</span>
    ),
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
];
