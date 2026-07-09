import { ColumnDef } from '@tanstack/react-table';
import { Warehouse } from '@/lib/types/warehouse';
import { ActionDropdown } from '@/components/ui/action-dropdown';

export const columns: ColumnDef<Warehouse>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => <div className="font-medium">{row.getValue('code')}</div>,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'siteName',
    header: 'Site',
    cell: ({ row }) => <div>{row.getValue('siteName') || '-'}</div>,
  },
  {
    accessorKey: 'city',
    header: 'City',
    cell: ({ row }) => <div>{row.getValue('city') || '-'}</div>,
  },
  {
    accessorKey: 'state',
    header: 'State',
    cell: ({ row }) => <div>{row.getValue('state') || '-'}</div>,
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <div className="flex items-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.getValue('isActive') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.getValue('isActive') ? 'Active' : 'Inactive'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: 'actions',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Actions</span>,
    cell: ({ row, table }) => {
      const warehouse = row.original;
      const meta = table.options.meta as any;
      return (
        <ActionDropdown
          onEdit={() => meta?.onEdit?.(warehouse)}
          onDelete={() => meta?.onDelete?.(warehouse)}
          deleteLabel="Delete Warehouse"
        />
      );
    },
  },
];
