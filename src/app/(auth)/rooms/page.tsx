"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Columns3,
  Edit2,
  Grid3x3,
  Layers,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeaderCard } from "@/components/page-header-card";
import { createRoom, deleteRoom, getRooms, updateRoom } from "@/lib/api/room";
import { getWarehouses } from "@/lib/api/warehouse";
import { Room } from "@/lib/types/room";
import { CreateRoomData, createRoomSchema } from "@/lib/validations/room";

export default function RoomsPage() {
  const { warehouse: sessionWarehouse } = useAuth();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedRoomForDetail, setSelectedRoomForDetail] = useState<Room | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {}
  });

  const queryClient = useQueryClient();

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-all"],
    queryFn: () => getWarehouses(1, 100)
  });

  const warehouses = warehousesData?.data || [];
  const effectiveWarehouseId =
    selectedWarehouseId ||
    sessionWarehouse?.id ||
    (warehouses.length > 0 ? warehouses[0].id : "");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["rooms", effectiveWarehouseId],
    queryFn: () => getRooms(effectiveWarehouseId),
    enabled: Boolean(effectiveWarehouseId)
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateRoomData) => createRoom(payload.warehouseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setIsFormDrawerOpen(false);
      form.reset();
      toast.success("Room created successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create room")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: payload }: { id: string; data: Partial<CreateRoomData> }) =>
      updateRoom(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setIsFormDrawerOpen(false);
      setSelectedRoom(null);
      form.reset();
      toast.success("Room updated successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update room")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setIsDetailsOpen(false);
      setSelectedRoomForDetail(null);
      toast.success("Room deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete room")
  });

  const form = useForm<CreateRoomData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      location: "",
      warehouseId: effectiveWarehouseId,
      isActive: true
    }
  });

  const rooms = data?.data || [];

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        !searchTerm ||
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (room.location && room.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && room.isActive) ||
        (statusFilter === "INACTIVE" && !room.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [rooms, searchTerm, statusFilter]);

  const openCreateDrawer = () => {
    setFormMode("CREATE");
    setSelectedRoom(null);
    form.reset({
      name: "",
      code: "",
      description: "",
      location: "",
      warehouseId: effectiveWarehouseId,
      isActive: true
    });
    setIsFormDrawerOpen(true);
  };

  const openEditDrawer = (room: Room) => {
    setSelectedRoom(room);
    setFormMode("EDIT");
    form.reset({
      name: room.name,
      code: room.code,
      description: room.description || "",
      location: room.location || "",
      warehouseId: room.warehouseId,
      isActive: room.isActive
    });
    setIsFormDrawerOpen(true);
  };

  const handleFormSubmit = (payload: CreateRoomData) => {
    if (formMode === "CREATE") {
      createMutation.mutate(payload);
      return;
    }
    if (selectedRoom) {
      updateMutation.mutate({ id: selectedRoom.id, data: payload });
    }
  };

  const handleDelete = (room: Room) => {
    setConfirmDelete({
      isOpen: true,
      title: "Delete Room",
      description: `Are you sure you want to delete room "${room.name}"? This action cannot be undone.`,
      onConfirm: () => deleteMutation.mutate(room.id)
    });
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("Rooms refreshed");
  };

  if (isLoading) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <Layers className="absolute h-5 w-5 animate-pulse text-blue-600" />
        </div>
        <span className="animate-pulse text-sm font-semibold text-slate-500">Loading rooms...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-rose-50 p-4">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load rooms</h3>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl border-slate-200">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Hero Banner */}
      <PageHeaderCard
        title="Rooms Master"
        description="Manage physical storage rooms, aisles & layout zones within warehouses."
        badge="Storage Infrastructure · Rooms"
        icon={Layers}
      >
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="rounded-xl p-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-blue-300" : ""}`} />
        </button>
        <button
          onClick={openCreateDrawer}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Room
        </button>
      </PageHeaderCard>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {warehouses.length > 1 && (
            <select
              value={effectiveWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/10 sm:w-56"
            >
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          )}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or code..."
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm focus:bg-white"
            />
          </div>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-all ${
                statusFilter === status
                  ? "border border-slate-200/50 bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
              <Layers className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No rooms found</p>
            <p className="mt-1 text-xs text-slate-400">
              Add a new room to start organizing physical storage layout
            </p>
            <button
              onClick={openCreateDrawer}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Add Room
            </button>
          </div>
        ) : (
          filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onOpen={() => {
                setSelectedRoomForDetail(room);
                setIsDetailsOpen(true);
              }}
              onEdit={() => openEditDrawer(room)}
              onDelete={() => handleDelete(room)}
            />
          ))
        )}
      </div>

      <RoomFormDrawer
        isOpen={isFormDrawerOpen}
        formMode={formMode}
        warehouses={warehouses}
        form={form}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onClose={() => setIsFormDrawerOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <RoomDetailsDrawer
        isOpen={isDetailsOpen}
        room={selectedRoomForDetail}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={(room) => {
          setIsDetailsOpen(false);
          openEditDrawer(room);
        }}
        onDelete={handleDelete}
      />

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmDelete.onConfirm();
          setConfirmDelete((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmDelete.title}
        description={confirmDelete.description}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function RoomCard({
  room,
  onOpen,
  onEdit,
  onDelete
}: {
  room: Room;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rowCount = room.rowCount ?? room.rows?.length ?? 0;
  const rackCount = room.rackCount ?? 0;
  const locationCount = room.locationCount ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">
          {room.code}
        </span>
        {room.isActive ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        ) : (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Inactive
          </span>
        )}
      </div>

      <h3 className="mt-2 text-base font-bold text-slate-900">{room.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
        {room.description || "Physical storage room for racks, shelves and box slots"}
      </p>
      {room.location && (
        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-blue-600">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{room.location}</span>
        </p>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300" />
          <span className="truncate">{room.warehouse?.name || "Warehouse"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {rowCount} {rowCount === 1 ? "Row" : "Rows"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Columns3 className="h-3.5 w-3.5 opacity-70" />
            {rackCount} {rackCount === 1 ? "Rack" : "Racks"}
          </span>
          <span className="inline-flex items-center gap-1 text-blue-600">
            <Grid3x3 className="h-3.5 w-3.5" />
            {locationCount} {locationCount === 1 ? "Slot" : "Slots"}
          </span>
        </div>
      </div>

      <div
        className="mt-3 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onEdit}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
          title="Edit room"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          title="Delete room"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function RoomFormDrawer({
  isOpen,
  formMode,
  warehouses,
  form,
  isSaving,
  onClose,
  onSubmit
}: {
  isOpen: boolean;
  formMode: "CREATE" | "EDIT";
  warehouses: Array<{ id: string; name: string; code: string }>;
  form: ReturnType<typeof useForm<CreateRoomData>>;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoomData) => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`flex w-screen max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">
                {formMode === "CREATE" ? "Add Room" : "Edit Room"}
              </h3>
            </div>
            <Button onClick={onClose} variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-slate-100">
              <X className="h-5 w-5 text-slate-400" />
            </Button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Room Name</Label>
                  <Input
                    id="name"
                    placeholder="Archive Room A"
                    className="h-11 rounded-xl border-slate-200"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Room Code</Label>
                  <Input
                    id="code"
                    placeholder="ARA"
                    className="h-11 rounded-xl border-slate-200 uppercase"
                    {...form.register("code")}
                  />
                  {form.formState.errors.code && (
                    <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouseId">Warehouse Assignment</Label>
                <select
                  id="warehouseId"
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/10"
                  {...form.register("warehouseId")}
                >
                  <option value="" disabled>
                    Select a Warehouse...
                  </option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </option>
                  ))}
                </select>
                {form.formState.errors.warehouseId && (
                  <p className="text-xs text-red-500">{form.formState.errors.warehouseId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. North Wing, Floor 2, Section A"
                  className="h-11 rounded-xl border-slate-200"
                  {...form.register("location")}
                />
                {form.formState.errors.location && (
                  <p className="text-xs text-red-500">{form.formState.errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Specify physical attributes..."
                  className="h-11 rounded-xl border-slate-200"
                  {...form.register("description")}
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">
                    Active Status
                  </Label>
                  <p className="text-[10px] font-semibold text-slate-400">
                    Enable or disable operator visibility for this room
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={form.watch("isActive")}
                  onCheckedChange={(checked) => form.setValue("isActive", checked)}
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
              <Button type="button" variant="outline" onClick={onClose} className="h-11 rounded-xl border-slate-200">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 rounded-xl bg-blue-600 px-5 text-white shadow-md hover:bg-blue-700"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function RoomDetailsDrawer({
  isOpen,
  room,
  onClose,
  onEdit,
  onDelete
}: {
  isOpen: boolean;
  room: Room | null;
  onClose: () => void;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={`flex w-screen max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">Room Details</h3>
            </div>
            <Button onClick={onClose} variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-slate-100">
              <X className="h-5 w-5 text-slate-400" />
            </Button>
          </div>

          {room && (
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-gradient-to-b from-blue-50/30 to-indigo-50/10 p-6 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-lg font-bold text-white shadow-md">
                  {room.code}
                </div>
                <h4 className="text-base font-extrabold text-slate-900">{room.name}</h4>
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold ${
                    room.isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {room.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-widest text-slate-400">Room Info</h5>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
                  <DetailRow label="Warehouse" value={room.warehouse?.name || "-"} />
                  <DetailRow label="Warehouse Code" value={room.warehouse?.code || "-"} />
                  <DetailRow label="Location" value={room.location || "-"} />
                  <DetailRow label="Description" value={room.description || "-"} />
                  <DetailRow label="Rows Configured" value={String(room.rowCount ?? room.rows?.length ?? 0)} />
                  <DetailRow label="Racks Configured" value={String(room.rackCount ?? 0)} />
                  <DetailRow label="Storage Slots" value={String(room.locationCount ?? 0)} />
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-6">
                <Button
                  onClick={() => onEdit(room)}
                  className="h-11 w-full rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Edit Room
                </Button>
                <Button
                  onClick={() => onDelete(room)}
                  variant="outline"
                  className="h-11 w-full rounded-xl border-red-200 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  Delete Room
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-right text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
