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
    accessorKey: 'fileBarcode',
    header: 'File',
    cell: ({ row, table }) => {
      const item = row.original;
      const meta = table.options.meta as any;
      return (
        <button
          className="font-mono text-sm font-semibold hover:text-blue-600 text-left"
          onClick={() => meta?.onCustomAction?.(item)}
        >
          {item.fileBarcode || item.summary}
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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const isRejected = status === 'REJECTED';
      return (
        <span
          className={`inline-flex px-2.5 py-0.5 rounded-lg border text-xs font-bold uppercase ${
            isRejected
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: 'reasonCode',
    header: 'Reason',
    cell: ({ row }) => {
      const reason = row.original.reasonCode;
      if (!reason) return <span className="text-slate-400">—</span>;
      return (
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
          {reason}
        </span>
      );
    },
  },
];
