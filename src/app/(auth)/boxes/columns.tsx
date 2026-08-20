"use client";

import { ColumnDef } from '@tanstack/react-table';
import { RecordBox } from '@/lib/api/records';
import { BoxStatusBadge } from '@/components/records/status-badge';
import { VisualBarcode } from '@/components/records/visual-barcode';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Eye,
  Edit,
  Printer,
  History,
  MoreHorizontal,
  MapPin,
  Building2,
  FileBox,
  Archive,
  Trash2
} from 'lucide-react';

export const columns: ColumnDef<RecordBox>[] = [
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
    header: 'Box Barcode',
    cell: ({ row, table }) => {
      const box = row.original;
      const meta = table.options.meta as any;
      return (
        <button
          className="group flex flex-col items-start gap-1 text-left py-1"
          onClick={() => meta?.onCustomAction?.(box)}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {box.barcode}
            </span>
          </div>
          <VisualBarcode code={box.barcode} width={110} height={20} showText={false} />
        </button>
      );
    },
  },
  {
    accessorKey: 'label',
    header: 'Label / Description',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-800">
          {row.original.label || 'Unlabeled Box'}
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          ID: {row.original.id.slice(0, 8)}...
        </span>
      </div>
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
    cell: ({ row }) => {
      const clientName = row.original.client?.name;
      const clientCode = row.original.client?.code;
      return (
        <div className="flex items-center gap-1.5 text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {clientName ? (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-800">{clientName}</span>
              {clientCode && <span className="text-[10px] text-slate-400 font-mono">{clientCode}</span>}
            </div>
          ) : (
            <span className="text-sm text-slate-400 font-normal">Unassigned</span>
          )}
        </div>
      );
    },
  },
  {
    id: 'location',
    header: 'Current Location',
    cell: ({ row }) => {
      const loc = row.original.location;
      return (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {loc ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-medium border border-slate-200">
              {loc.barcode}
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">No Location</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'fileCount',
    header: 'Files / Capacity',
    cell: ({ row }) => {
      const fileCount = row.original.fileCount ?? 0;
      const capacity = (row.original as any).capacity || row.original.fileCapacity || 25;
      const availableSlots = Math.max(0, capacity - fileCount);
      const percentage = Math.min(100, Math.round((fileCount / capacity) * 100));

      return (
        <div className="flex flex-col gap-1.5 w-32">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800 font-mono">{fileCount} / {capacity}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              availableSlots === 0 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {availableSlots === 0 ? 'FULL' : `${availableSlots} Left`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
            <div
              className={`h-full rounded-full transition-all ${
                percentage >= 100
                  ? 'bg-rose-500'
                  : percentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Updated',
    cell: ({ row }) => (
      <span className="text-xs text-slate-500">
        {new Date(row.original.updatedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const box = row.original;
      const meta = table.options.meta as any;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
              <MoreHorizontal className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200">
            <DropdownMenuLabel className="text-xs text-slate-400 font-normal">
              Box Actions
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-slate-700"
              onClick={() => meta?.onCustomAction?.(box)}
            >
              <Eye className="w-4 h-4 text-blue-600" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-slate-700"
              onClick={() => meta?.onEdit?.(box)}
            >
              <Edit className="w-4 h-4 text-indigo-600" /> Edit Label
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-slate-700"
              onClick={() => meta?.onPrintBarcode?.(box)}
            >
              <Printer className="w-4 h-4 text-emerald-600" /> Print Barcode
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-slate-700"
              onClick={() => meta?.onViewTimeline?.(box)}
            >
              <History className="w-4 h-4 text-amber-600" /> View Audit Timeline
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 font-semibold"
              onClick={() => meta?.onDelete?.(box)}
            >
              <Trash2 className="w-4 h-4 text-rose-600" /> Delete Box
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
