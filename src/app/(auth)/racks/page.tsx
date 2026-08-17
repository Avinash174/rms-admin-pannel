"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Columns3,
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
import { createRack, deleteRack, getRacks, updateRack } from "@/lib/api/rack";
import { getRooms } from "@/lib/api/room";
import { getWarehouses } from "@/lib/api/warehouse";
import { Rack } from "@/lib/types/rack";
import { Room } from "@/lib/types/room";
import {
  CreateRackData,
  createRackSchema,
  generateRackCode
} from "@/lib/validations/rack";

function roomLabel(room: Room) {
  if (room.location) {
    return `${room.name} - ${room.location} (${room.code})`;
  }
  return `${room.name} (${room.code})`;
}

export default function RacksPage() {
  const { warehouse: sessionWarehouse } = useAuth();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null);
  const [selectedRackForDetail, setSelectedRackForDetail] = useState<Rack | null>(null);
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

  const { data: roomsData } = useQuery({
    queryKey: ["rooms-all", effectiveWarehouseId],
    queryFn: () => getRooms(effectiveWarehouseId),
    enabled: Boolean(effectiveWarehouseId)
  });

  const rooms = roomsData?.data || [];

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["racks", effectiveWarehouseId],
    queryFn: () => getRacks({ warehouseId: effectiveWarehouseId }),
    enabled: Boolean(effectiveWarehouseId)
  });

  const form = useForm<CreateRackData>({
    resolver: zodResolver(createRackSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      floor: "",
      roomId: "",
      isActive: true
    }
  });

  const watchedName = form.watch("name");

  useEffect(() => {
    if (formMode === "CREATE" && watchedName) {
      form.setValue("code", generateRackCode(watchedName), { shouldValidate: true });
    }
  }, [watchedName, formMode, form]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateRackData) => createRack(payload.roomId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
      setIsFormDrawerOpen(false);
      form.reset();
      toast.success("Rack created successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create rack")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: payload }: { id: string; data: Partial<CreateRackData> }) =>
      updateRack(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
      setIsFormDrawerOpen(false);
      setSelectedRack(null);
      form.reset();
      toast.success("Rack updated successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update rack")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["racks"] });
      setIsDetailsOpen(false);
      setSelectedRackForDetail(null);
      toast.success("Rack deleted successfully");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete rack")
  });

  const racks = data?.data || [];

  const filteredRacks = useMemo(() => {
    return racks.filter((rack) => {
      const roomName = rack.room?.name || rack.roomName || "";
      const roomLocation = rack.room?.location || "";
      const matchesSearch =
        !searchTerm ||
        rack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rack.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rack.floor && rack.floor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rack.description && rack.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roomLocation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && rack.isActive) ||
        (statusFilter === "INACTIVE" && !rack.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [racks, searchTerm, statusFilter]);

  const openCreateDrawer = () => {
    setFormMode("CREATE");
    setSelectedRack(null);
    form.reset({
      name: "",
      code: "",
      description: "",
      floor: "",
      roomId: rooms[0]?.id || "",
      isActive: true
    });
    setIsFormDrawerOpen(true);
  };

  const openEditDrawer = (rack: Rack) => {
    setSelectedRack(rack);
    setFormMode("EDIT");
    form.reset({
      name: rack.name,
      code: rack.code,
      description: rack.description || "",
      floor: rack.floor || "",
      roomId: rack.roomId,
      isActive: rack.isActive
    });
    setIsFormDrawerOpen(true);
  };

  const handleFormSubmit = (payload: CreateRackData) => {
    if (formMode === "CREATE") {
      createMutation.mutate(payload);
      return;
    }
    if (selectedRack) {
      updateMutation.mutate({ id: selectedRack.id, data: payload });
    }
  };

  const handleDelete = (rack: Rack) => {
    setConfirmDelete({
      isOpen: true,
      title: "Delete Rack",
      description: `Are you sure you want to delete "${rack.name}"? This action cannot be undone.`,
      onConfirm: () => deleteMutation.mutate(rack.id)
    });
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("Racks refreshed");
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <Archive className="absolute h-5 w-5 animate-pulse text-blue-600" />
        </div>
        <span className="animate-pulse text-sm font-semibold text-slate-500">Loading racks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-rose-50 p-4">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to load racks</h3>
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
        title="Racks Master"
        description="Manage physical racks and cupboards within warehouse rooms."
        badge="Storage Infrastructure · Racks"
        icon={Archive}
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
          disabled={rooms.length === 0}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Rack
        </button>
      </PageHeaderCard>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {warehouses.length > 1 && (
            <select
              value={effectiveWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/10 sm:w-56"
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
              placeholder="Search rack, room or floor..."
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
                  ? "border border-slate-200/50 bg-white text-violet-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {status.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {rooms.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          Add at least one room before creating racks.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRacks.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
              <Archive className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-800">No racks found</p>
            <p className="mt-1 text-xs text-slate-400">Add a rack and assign it to a room</p>
            <button
              onClick={openCreateDrawer}
              disabled={rooms.length === 0}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add Rack
            </button>
          </div>
        ) : (
          filteredRacks.map((rack) => (
            <RackCard
              key={rack.id}
              rack={rack}
              onOpen={() => {
                setSelectedRackForDetail(rack);
                setIsDetailsOpen(true);
              }}
              onEdit={() => openEditDrawer(rack)}
              onDelete={() => handleDelete(rack)}
            />
          ))
        )}
      </div>

      {/* Add / Edit drawer — same UI as before, with extra fields */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${
          isFormDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsFormDrawerOpen(false)} />
        <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
          <div
            className={`flex w-screen max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
              isFormDrawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-violet-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === "CREATE" ? "Add Rack" : "Edit Rack"}
                </h3>
              </div>
              <Button onClick={() => setIsFormDrawerOpen(false)} variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>

            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Rack / Cupboard <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter rack or cupboard name"
                    className="h-11 rounded-xl border-slate-200"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomId">
                    Room / Location <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="roomId"
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/10"
                    {...form.register("roomId")}
                  >
                    <option value="" disabled>
                      Select...
                    </option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {roomLabel(room)}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.roomId && (
                    <p className="text-xs text-red-500">{form.formState.errors.roomId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input
                    id="floor"
                    placeholder="e.g. Ground Floor, 1st Floor"
                    className="h-11 rounded-xl border-slate-200"
                    {...form.register("floor")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Additional notes about this rack"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/10"
                    {...form.register("description")}
                  />
                </div>

                {formMode === "EDIT" && (
                  <div className="space-y-2">
                    <Label htmlFor="code">Rack Code</Label>
                    <Input
                      id="code"
                      className="h-11 rounded-xl border-slate-200 uppercase"
                      {...form.register("code")}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive" className="text-sm font-bold text-slate-800">
                      Active Status
                    </Label>
                    <p className="text-[10px] font-semibold text-slate-400">
                      Enable or disable this rack for operators
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
                <Button type="button" variant="outline" onClick={() => setIsFormDrawerOpen(false)} className="h-11 rounded-xl border-slate-200">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-11 rounded-xl bg-violet-600 px-5 text-white shadow-md hover:bg-violet-700"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <RackDetailsDrawer
        isOpen={isDetailsOpen}
        rack={selectedRackForDetail}
        onClose={() => setIsDetailsOpen(false)}
        onEdit={(rack) => {
          setIsDetailsOpen(false);
          openEditDrawer(rack);
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

function RackCard({
  rack,
  onOpen,
  onEdit,
  onDelete
}: {
  rack: Rack;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const shelfCount = rack._count?.shelves ?? rack.shelfCount ?? 0;
  const roomName = rack.room?.name || rack.roomName || "Room";
  const roomLocation = rack.room?.location;

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
      className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-violet-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-600">
          {rack.code}
        </span>
        {rack.isActive ? (
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

      <h3 className="mt-2 text-base font-bold text-slate-900">{rack.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
        {rack.description || "Physical rack or cupboard for box storage"}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600">
        <span className="inline-flex items-center gap-1 text-violet-700">
          <Layers className="h-3 w-3" />
          {roomName}
        </span>
        {roomLocation && (
          <span className="inline-flex items-center gap-1 text-blue-600">
            <MapPin className="h-3 w-3" />
            {roomLocation}
          </span>
        )}
        {rack.floor && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">Floor: {rack.floor}</span>
        )}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Columns3 className="h-3.5 w-3.5" />
            {shelfCount} {shelfCount === 1 ? "Shelf" : "Shelves"}
          </span>
        </div>
      </div>

      <div
        className="mt-3 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(event) => event.stopPropagation()}
      >
        <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600" title="Edit rack">
          <Edit2 className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete rack">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function RackDetailsDrawer({
  isOpen,
  rack,
  onClose,
  onEdit,
  onDelete
}: {
  isOpen: boolean;
  rack: Rack | null;
  onClose: () => void;
  onEdit: (rack: Rack) => void;
  onDelete: (rack: Rack) => void;
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
              <Archive className="h-5 w-5 text-violet-600" />
              <h3 className="text-lg font-bold text-slate-900">Rack Details</h3>
            </div>
            <Button onClick={onClose} variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-slate-100">
              <X className="h-5 w-5 text-slate-400" />
            </Button>
          </div>

          {rack && (
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-gradient-to-b from-violet-50/30 to-indigo-50/10 p-6 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white shadow-md">
                  {rack.code}
                </div>
                <h4 className="text-base font-extrabold text-slate-900">{rack.name}</h4>
              </div>

              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
                <DetailRow label="Room / Location" value={rack.room ? roomLabel(rack.room as Room) : "-"} />
                <DetailRow label="Floor" value={rack.floor || "-"} />
                <DetailRow label="Description" value={rack.description || "-"} />
                <DetailRow label="Shelves" value={String(rack._count?.shelves ?? 0)} />
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-6">
                <Button onClick={() => onEdit(rack)} className="h-11 w-full rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800">
                  Edit Rack
                </Button>
                <Button onClick={() => onDelete(rack)} variant="outline" className="h-11 w-full rounded-xl border-red-200 text-xs font-bold text-red-600 hover:bg-red-50">
                  Delete Rack
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
      <span className="max-w-[60%] text-right text-xs font-semibold text-slate-700">{value}</span>
    </div>
  );
}
