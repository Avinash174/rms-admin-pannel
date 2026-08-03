import { ColumnDef } from '@tanstack/react-table';
import { RecordBox } from '@/lib/api/records';
import { BoxStatusBadge } from '@/components/records/status-badge';

export const columns: ColumnDef<RecordBox>[] = [
  {
    accessorKey: 'barcode',
    header: 'Barcode',
    cell: ({ row, table }) => {
      const box = row.original;
      const meta = table.options.meta as any;
      return (
        <button
          className="font-mono text-sm font-semibold text-slate-800 hover:text-blue-600 text-left"
          onClick={() => meta?.onCustomAction?.(box)}
        >
          {box.barcode}
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
    cell: ({ row }) => <BoxStatusBadge status={row.original.status} />,
  },
  {
    id: 'client',
    header: 'Client',
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{row.original.client?.name || '—'}</span>
    ),
  },
  {
    id: 'location',
    header: 'Location',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-slate-600">
        {row.original.location?.barcode || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'fileCount',
    header: 'Files',
    cell: ({ row }) => (
      <span className="text-sm font-semibold text-slate-700">{row.original.fileCount ?? 0}</span>
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
