import { ColumnDef } from '@tanstack/react-table';
import { FileRecord } from '@/lib/types/fileRecord';
import { Calendar, FileText } from 'lucide-react';

export const columns: ColumnDef<FileRecord>[] = [
  {
    accessorKey: 'barcode',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Barcode</span>,
    cell: ({ row, table }) => {
      const fileRecord = row.original;
      const meta = table.options.meta as any;

      return (
        <div 
          className="flex items-center gap-3 py-1 cursor-pointer group"
          onClick={() => meta?.onCustomAction?.(fileRecord)}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition-transform duration-200">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-sm font-bold text-slate-900 leading-none group-hover:text-blue-600 transition-colors duration-250">
              {fileRecord.barcode}
            </span>
            <span className="text-[10px] text-slate-400 mt-1 select-all font-mono">
              ID: {fileRecord.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'title',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Title</span>,
    cell: ({ row }) => (
      <div className="font-semibold text-slate-800 text-sm max-w-[200px] truncate leading-tight">
        {row.getValue('title')}
      </div>
    ),
  },
  {
    accessorKey: 'referenceNumber',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Reference</span>,
    cell: ({ row }) => (
      <div className="font-mono text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg inline-block">
        {row.getValue('referenceNumber') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'boxBarcode',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Box</span>,
    cell: ({ row }) => (
      <div className="font-mono text-xs font-bold text-slate-650 text-slate-700">
        {row.getValue('boxBarcode') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'clientName',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Client</span>,
    cell: ({ row }) => (
      <div className="text-xs text-slate-600 font-medium max-w-[120px] truncate">
        {row.getValue('clientName') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'departmentName',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Department</span>,
    cell: ({ row }) => (
      <div className="text-xs text-slate-500 font-semibold max-w-[120px] truncate">
        {row.getValue('departmentName') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Status</span>,
    cell: ({ row, table }) => {
      const fileRecord = row.original;
      const meta = table.options.meta as any;
      const status = row.getValue('status') as 'ACTIVE' | 'ARCHIVED' | 'DESTROYED';
      const isActive = status === 'ACTIVE';

      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const nextStatus = isActive ? 'ARCHIVED' : 'ACTIVE';
            meta?.onEdit?.({ ...fileRecord, status: nextStatus }, true);
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
          {isActive ? 'Active' : 'Inactive'}
        </button>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: () => <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Created Date</span>,
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
