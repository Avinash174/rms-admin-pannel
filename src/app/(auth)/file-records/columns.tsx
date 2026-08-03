import { ColumnDef } from '@tanstack/react-table';
import { RecordFile } from '@/lib/api/records';
import { FileStatusBadge } from '@/components/records/status-badge';

export const columns: ColumnDef<RecordFile>[] = [
  {
    accessorKey: 'barcode',
    header: 'Barcode',
    cell: ({ row, table }) => {
      const file = row.original;
      const meta = table.options.meta as any;
      return (
        <button
          className="font-mono text-sm font-semibold text-slate-800 hover:text-blue-600 text-left"
          onClick={() => meta?.onCustomAction?.(file)}
        >
          {file.barcode}
        </button>
      );
    },
  },
  {
    accessorKey: 'label',
    header: 'Label',
    cell: ({ row }) => (
      <span className="text-sm text-slate-700">{row.original.label || '—'}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <FileStatusBadge status={row.original.status} />,
  },
  {
    id: 'box',
    header: 'Box',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-slate-600">{row.original.box?.barcode || '—'}</span>
    ),
  },
  {
    id: 'client',
    header: 'Client',
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.client?.name || '—'}</span>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    cell: ({ row }) => (
      <span className="text-xs text-slate-500">
        {new Date(row.original.updatedAt).toLocaleDateString()}
      </span>
    ),
  },
];
