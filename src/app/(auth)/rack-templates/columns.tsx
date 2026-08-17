import { ColumnDef } from '@tanstack/react-table';
import { RackTemplate } from '@/lib/types/rack-template';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Copy,
  Edit,
  Eye,
  Grid,
  MoreHorizontal,
  Power,
  Sparkles,
  Trash2
} from 'lucide-react';

export const columns: ColumnDef<RackTemplate>[] = [
  {
    accessorKey: 'code',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Template Code</span>,
    cell: ({ row }) => (
      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">
        {row.original.code}
      </span>
    )
  },
  {
    accessorKey: 'name',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Template Name</span>,
    cell: ({ row, table }) => (
      <button
        className="text-left text-sm font-semibold text-slate-900 hover:text-blue-600"
        onClick={() => (table.options.meta as any)?.onCustomAction?.(row.original)}
      >
        {row.original.name}
      </button>
    )
  },
  {
    accessorKey: 'warehouseType',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Warehouse Type</span>,
    cell: ({ row }) => <span className="text-xs font-medium text-slate-600">{row.original.warehouseType}</span>
  },
  {
    accessorKey: 'rowsCount',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rows</span>
  },
  {
    accessorKey: 'racksCount',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rack/Row</span>
  },
  {
    accessorKey: 'levelsCount',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Levels/Rack</span>
  },
  {
    id: 'locationsPerLevel',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Locations/Level</span>,
    cell: ({ row }) => (
      <span className="text-xs text-slate-600">
        {row.original.locationPerLevelDisplay ?? row.original.locationPerLevel ?? row.original.locRows * row.original.locCols}
      </span>
    )
  },
  {
    accessorKey: 'status',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</span>,
    cell: ({ row }) => (
      <span
        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
          row.original.status === 'ACTIVE'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        {row.original.status}
      </span>
    )
  },
  {
    id: 'createdBy',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Created By</span>,
    cell: ({ row }) => (
      <span className="text-xs text-slate-600">{row.original.createdByUser?.fullName || '-'}</span>
    )
  },
  {
    accessorKey: 'createdAt',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Created Date</span>,
    cell: ({ row }) => (
      <span className="text-xs text-slate-500">{format(new Date(row.original.createdAt), 'dd MMM yyyy')}</span>
    )
  },
  {
    id: 'actions',
    header: () => <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Actions</span>,
    cell: ({ row, table }) => {
      const template = row.original;
      const meta = table.options.meta as any;
      const isActive = template.status === 'ACTIVE';

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-lg p-0 hover:bg-slate-100">
              <MoreHorizontal className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-200 shadow-lg">
            <DropdownMenuLabel className="text-xs font-normal text-slate-400">Template Actions</DropdownMenuLabel>
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => meta?.onCustomAction?.(template)}>
              <Eye className="h-4 w-4 text-blue-600" /> View
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => meta?.onEdit?.(template)}>
              <Edit className="h-4 w-4 text-indigo-600" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => meta?.onPrintBarcode?.(template)}>
              <Sparkles className="h-4 w-4 text-violet-600" /> Preview Layout
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => meta?.onDeactivate?.(template)}>
              <Grid className="h-4 w-4 text-emerald-600" /> Apply Template
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => meta?.onViewTimeline?.(template)}>
              <Copy className="h-4 w-4 text-amber-600" /> Clone
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => meta?.onEdit?.(template, true)}
            >
              <Power className={`h-4 w-4 ${isActive ? 'text-rose-600' : 'text-emerald-600'}`} />
              {isActive ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 font-semibold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
              onClick={() => meta?.onDelete?.(template)}
            >
              <Trash2 className="h-4 w-4 text-rose-600" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
