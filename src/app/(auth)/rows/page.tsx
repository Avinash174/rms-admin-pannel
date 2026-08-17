"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Layers,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeaderCard } from "@/components/page-header-card";
import { createRow, deleteRow, updateRow } from "@/lib/api/row";
import { getRacks } from "@/lib/api/rack";
import { getRooms } from "@/lib/api/room";
import { getWarehouses } from "@/lib/api/warehouse";
import { Row } from "@/lib/types/row";
import { Room } from "@/lib/types/room";
import { CreateRowData, createRowSchema, UpdateRowData, updateRowSchema } from "@/lib/validations/row";

function roomLocationText(room?: Room | null) {
  if (!room) return "";
  if (room.location) return `${room.name} - ${room.location}`;
  return room.name;
}

export default function RowsMasterPage() {
  const { warehouse: sessionWarehouse } = useAuth();
  const queryClient = useQueryClient();

  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);
  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {}
  });

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-all"],
    queryFn: () => getWarehouses(1, 100)
  });

  const warehouses = warehousesData?.data || [];
  const effectiveWarehouseId =
    selectedWarehouseId || sessionWarehouse?.id || (warehouses.length > 0 ? warehouses[0].id : "");

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms-all", effectiveWarehouseId],
    queryFn: () => getRooms(effectiveWarehouseId),
    enabled: Boolean(effectiveWarehouseId)
  });

  const rooms = roomsData?.data || [];

  const { data: rowsList = [], refetch, isFetching, isLoading, error } = useQuery({
    queryKey: ["rows-list", effectiveWarehouseId],
    queryFn: async () => {
      const extracted: Row[] = [];
      rooms.forEach((room) => {
        (room.rows || []).forEach((row) => {
          extracted.push({
            ...row,
            isActive: row.isActive ?? true,
            createdAt: "",
            updatedAt: "",
            roomName: room.name,
            roomCode: room.code,
            roomLocation: room.location || undefined
          });
        });
      });
      return extracted;
    },
    enabled: rooms.length > 0
  });

  const form = useForm<CreateRowData>({
    resolver: zodResolver(formMode === "CREATE" ? createRowSchema : updateRowSchema) as any,
    defaultValues: {
      column: "",
      rowPrefix: "R",
      noOfRows: 1,
      columnsInCell: 1,
      rackId: "",
      roomId: "",
      roomLocation: "",
      floor: "",
      capacityOfCell: 1,
      isTemporaryLocation: false,
      description: ""
    }
  });

  const watchedRackId = form.watch("rackId");

  const { data: racksData } = useQuery({
    queryKey: ["racks-for-row", effectiveWarehouseId],
    queryFn: () => getRacks({ warehouseId: effectiveWarehouseId }),
    enabled: Boolean(effectiveWarehouseId)
  });

  const racks = racksData?.data || [];

  useEffect(() => {
    if (!watchedRackId) return;
    const rack = racks.find((r) => r.id === watchedRackId);
    if (!rack) return;
    form.setValue("roomId", rack.roomId);
    const room = rooms.find((r) => r.id === rack.roomId) || (rack.room as Room | undefined);
    form.setValue("roomLocation", roomLocationText(room));
    if (rack.floor) {
      form.setValue("floor", rack.floor);
    }
  }, [watchedRackId, racks, rooms, form]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateRowData) => {
      const { roomId, roomLocation: _roomLocation, ...data } = payload;
      return createRow(roomId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rows-list"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-all"] });
      setIsFormOpen(false);
      form.reset();
      toast.success("Row saved successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save row")
  });

  const updateMutation = useMutation({
    mutationFn: ({ roomId, rowId, data }: { roomId: string; rowId: string; data: UpdateRowData }) =>
      updateRow(roomId, rowId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rows-list"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-all"] });
      setIsFormOpen(false);
      setSelectedRow(null);
      form.reset();
      toast.success("Row updated successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update row")
  });

  const deleteMutation = useMutation({
    mutationFn: ({ roomId, rowId }: { roomId: string; rowId: string }) => deleteRow(roomId, rowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rows-list"] });
      queryClient.invalidateQueries({ queryKey: ["rooms-all"] });
      setIsDetailsOpen(false);
      toast.success("Row deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete row")
  });

  const filteredRows = useMemo(() => {
    return rowsList.filter((row) => {
      const matchesSearch =
        !searchTerm ||
        row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.column && row.column.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (row.roomName && row.roomName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && row.isActive) ||
        (statusFilter === "INACTIVE" && !row.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [rowsList, searchTerm, statusFilter]);

  const openCreate = () => {
    setFormMode("CREATE");
    setSelectedRow(null);
    form.reset({
      column: "",
      rowPrefix: "R",
      noOfRows: 1,
      columnsInCell: 1,
      rackId: "",
      roomId: "",
      roomLocation: "",
      floor: "",
      capacityOfCell: 1,
      isTemporaryLocation: false,
      description: ""
    });
    setIsFormOpen(true);
  };

  const openEdit = (row: Row) => {
    setFormMode("EDIT");
    setSelectedRow(row);
    form.reset({
      column: row.column || "",
      rowPrefix: row.rowPrefix || "R",
      columnsInCell: row.columnsInCell || 1,
      rackId: row.racks?.[0]?.id || "",
      roomId: row.roomId,
      roomLocation: row.roomLocation || row.roomName || "",
      floor: row.floor || "",
      capacityOfCell: row.capacityOfCell || 1,
      isTemporaryLocation: row.isTemporaryLocation || false,
      description: row.description || ""
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (values: CreateRowData) => {
    if (formMode === "CREATE") {
      createMutation.mutate(values);
      return;
    }
    if (selectedRow) {
      const { noOfRows: _noOfRows, roomLocation: _roomLocation, ...data } = values;
      updateMutation.mutate({ roomId: selectedRow.roomId, rowId: selectedRow.id, data });
    }
  };

  const handleDelete = (row: Row) => {
    setConfirmDelete({
      isOpen: true,
      title: "Delete Row",
      description: `Are you sure you want to delete "${row.name}"?`,
      onConfirm: () => deleteMutation.mutate({ roomId: row.roomId, rowId: row.id })
    });
  };

  if (isLoading || roomsLoading) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-100 border-t-violet-600" />
          <Layers className="absolute h-5 w-5 animate-pulse text-violet-600" />
        </div>
        <span className="text-sm font-semibold text-slate-500">Loading rows...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Hero Banner */}
      <PageHeaderCard
        title="Shelf / Row Master"
        description="Shelf and Row position configuration across warehouse storage zones."
        badge="Storage Infrastructure · Rows"
        icon={Layers}
      >
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl p-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-blue-300" : ""}`} />
        </button>
        <button
          onClick={openCreate}
          disabled={!effectiveWarehouseId}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Shelf / Row
        </button>
      </PageHeaderCard>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {warehouses.length > 1 && (
            <select
              value={effectiveWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm sm:w-56"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          )}
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search row, column or room..."
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm"
            />
          </div>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize ${
                statusFilter === status ? "bg-white text-violet-600 shadow-sm" : "text-slate-500"
              }`}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRows.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Layers className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-800">No rows configured yet</p>
            <p className="mt-1 text-xs text-slate-400">Add a row or apply a Rack Template to generate rows automatically</p>
          </div>
        ) : (
          filteredRows.map((row) => (
            <div
              key={row.id}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-violet-200 hover:shadow-md"
              onClick={() => {
                setDetailRow(row);
                setIsDetailsOpen(true);
              }}
            >
              <div className="flex items-start justify-between">
                <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600 uppercase">
                  {row.code}
                </span>
                {row.isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Inactive</span>
                )}
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-900">{row.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                {row.column && <span className="rounded-md bg-slate-100 px-2 py-0.5">Col: {row.column}</span>}
                {row.roomName && (
                  <span className="inline-flex items-center gap-1 text-violet-700">
                    <Layers className="h-3 w-3" /> {row.roomName}
                  </span>
                )}
                {row.roomLocation && (
                  <span className="inline-flex items-center gap-1 text-blue-600">
                    <MapPin className="h-3 w-3" /> {row.roomLocation}
                  </span>
                )}
              </div>
              <div
                className="mt-3 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => openEdit(row)} className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(row)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit drawer — same pattern as Racks Master */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isFormOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsFormOpen(false)} />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
          <div
            className={`flex h-full w-screen max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
              isFormOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-violet-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === "CREATE" ? "Shelf / Row No." : "Edit Shelf / Row"}
                </h3>
              </div>
              <Button onClick={() => setIsFormOpen(false)} variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-5 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="column">
                      Column <span className="text-red-500">*</span>
                    </Label>
                    <Input id="column" className="h-11 rounded-xl border-slate-200" {...form.register("column")} />
                    {form.formState.errors.column && (
                      <p className="text-xs text-red-500">{form.formState.errors.column.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rowPrefix">
                      Row Prefix <span className="text-red-500">*</span>
                    </Label>
                    <Input id="rowPrefix" className="h-11 rounded-xl border-slate-200 uppercase" {...form.register("rowPrefix")} />
                    {form.formState.errors.rowPrefix && (
                      <p className="text-xs text-red-500">{form.formState.errors.rowPrefix.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {formMode === "CREATE" && (
                    <div className="space-y-2">
                      <Label htmlFor="noOfRows">
                        No. of Row <span className="text-red-500">*</span>
                      </Label>
                      <Input id="noOfRows" type="number" min={1} className="h-11 rounded-xl border-slate-200" {...form.register("noOfRows")} />
                    </div>
                  )}
                  <div className={`space-y-2 ${formMode === "EDIT" ? "col-span-2" : ""}`}>
                    <Label htmlFor="columnsInCell">
                      Columns in Cell <span className="text-red-500">*</span>
                    </Label>
                    <Input id="columnsInCell" type="number" min={1} className="h-11 rounded-xl border-slate-200" {...form.register("columnsInCell")} />
                    {form.formState.errors.columnsInCell && (
                      <p className="text-xs text-red-500">{form.formState.errors.columnsInCell.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rackId">
                    Rack / Cupboard <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="rackId"
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/10"
                    {...form.register("rackId")}
                  >
                    <option value="">Select...</option>
                    {racks.map((rack) => (
                      <option key={rack.id} value={rack.id}>
                        {rack.name} ({rack.code})
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.rackId && (
                    <p className="text-xs text-red-500">{form.formState.errors.rackId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomLocation">Room / Location</Label>
                  <Input
                    id="roomLocation"
                    readOnly
                    placeholder="Auto-filled when rack is selected"
                    className="h-11 rounded-xl border-slate-200 bg-slate-50"
                    {...form.register("roomLocation")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input id="floor" placeholder="e.g. Ground Floor" className="h-11 rounded-xl border-slate-200" {...form.register("floor")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacityOfCell">
                    Capacity of Cell <span className="text-red-500">*</span>
                  </Label>
                  <Input id="capacityOfCell" type="number" min={1} className="h-11 rounded-xl border-slate-200" {...form.register("capacityOfCell")} />
                  {form.formState.errors.capacityOfCell && (
                    <p className="text-xs text-red-500">{form.formState.errors.capacityOfCell.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <input
                    id="isTemporaryLocation"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300"
                    {...form.register("isTemporaryLocation")}
                  />
                  <Label htmlFor="isTemporaryLocation" className="cursor-pointer text-sm font-semibold text-slate-800">
                    Temporary Location
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Additional notes about this shelf / row"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/10"
                    {...form.register("description")}
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="h-11 rounded-xl border-slate-200">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="h-11 rounded-xl bg-violet-600 px-5 text-white shadow-md hover:bg-violet-700"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Details drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isDetailsOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsDetailsOpen(false)} />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
          <div
            className={`flex h-full w-screen max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
              isDetailsOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-violet-600" />
                <h3 className="text-lg font-bold text-slate-900">Shelf / Row Details</h3>
              </div>
              <Button onClick={() => setIsDetailsOpen(false)} variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>
            {detailRow && (
              <div className="flex-1 space-y-4 overflow-y-auto p-6 text-xs">
                <div className="divide-y rounded-2xl border border-slate-100">
                  {[
                    ["Code", detailRow.code],
                    ["Column", detailRow.column || "-"],
                    ["Row Prefix", detailRow.rowPrefix || "-"],
                    ["Columns in Cell", detailRow.columnsInCell ?? "-"],
                    ["Capacity of Cell", detailRow.capacityOfCell ?? "-"],
                    ["Room", detailRow.roomName || "-"],
                    ["Floor", detailRow.floor || "-"],
                    ["Temporary", detailRow.isTemporaryLocation ? "Yes" : "No"],
                    ["Rack", detailRow.racks?.[0]?.name || "-"],
                    ["Description", detailRow.description || "-"]
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between px-4 py-3">
                      <span className="font-semibold text-slate-500">{label}</span>
                      <span className="font-semibold text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    openEdit(detailRow);
                  }}
                  className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  Edit Shelf / Row
                </Button>
                <Button onClick={() => handleDelete(detailRow)} variant="outline" className="h-11 w-full rounded-xl border-red-200 text-red-600">
                  Delete Row
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete((p) => ({ ...p, isOpen: false }))}
        onConfirm={() => {
          confirmDelete.onConfirm();
          setConfirmDelete((p) => ({ ...p, isOpen: false }));
        }}
        title={confirmDelete.title}
        description={confirmDelete.description}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
