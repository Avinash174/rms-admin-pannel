import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  meta?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onEdit?: (row: TData, isToggle?: boolean) => void
  onDelete?: (row: TData) => void
  onDeactivate?: (row: TData) => void
  onCustomAction?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
  onPageChange,
  onEdit,
  onDelete,
  onDeactivate,
  onCustomAction,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: meta?.pageSize || 20,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    pageCount: meta?.totalPages || 1,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    meta: {
      onEdit,
      onDelete,
      onDeactivate,
      onCustomAction,
    },
  })

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, pageIndex: newPage })
    onPageChange?.(newPage + 1)
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {meta && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-slate-500">
            Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(0)}
              disabled={pagination.pageIndex === 0}
            >
              First
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.pageIndex - 1)}
              disabled={pagination.pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.pageIndex + 1)}
              disabled={pagination.pageIndex >= table.getPageCount() - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(table.getPageCount() - 1)}
              disabled={pagination.pageIndex >= table.getPageCount() - 1}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
