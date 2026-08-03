"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWarehouses } from "@/lib/api/warehouse";
import { getRooms } from "@/lib/api/room";
import { getRacks } from "@/lib/api/rack";
import { getShelves } from "@/lib/api/shelf";
import { Label } from "@/components/ui/label";

type HierarchyDepth = "room" | "rack" | "shelf";

interface HierarchyFiltersProps {
  depth: HierarchyDepth;
  warehouseId: string;
  roomId: string;
  rackId: string;
  shelfId?: string;
  onWarehouseChange: (id: string) => void;
  onRoomChange: (id: string) => void;
  onRackChange: (id: string) => void;
  onShelfChange?: (id: string) => void;
}

export function HierarchyFilters({
  depth,
  warehouseId,
  roomId,
  rackId,
  shelfId = "",
  onWarehouseChange,
  onRoomChange,
  onRackChange,
  onShelfChange
}: HierarchyFiltersProps) {
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-all"],
    queryFn: () => getWarehouses(1, 100)
  });

  const warehouses = warehousesData?.data || [];
  const effectiveWarehouseId = warehouseId || warehouses[0]?.id || "";

  const { data: roomsData } = useQuery({
    queryKey: ["rooms-all", effectiveWarehouseId],
    queryFn: () => getRooms(effectiveWarehouseId),
    enabled: !!effectiveWarehouseId
  });

  const rooms = roomsData?.data || [];
  const effectiveRoomId = roomId || rooms[0]?.id || "";

  const { data: racksData } = useQuery({
    queryKey: ["racks-all", effectiveRoomId],
    queryFn: () => getRacks(effectiveRoomId),
    enabled: depth !== "room" && !!effectiveRoomId
  });

  const racks = racksData?.data || [];
  const effectiveRackId = rackId || racks[0]?.id || "";

  const { data: shelvesData } = useQuery({
    queryKey: ["shelves-all", effectiveRackId],
    queryFn: () => getShelves(effectiveRackId),
    enabled: depth === "shelf" && !!effectiveRackId
  });

  const shelves = shelvesData?.data || [];
  const effectiveShelfId = shelfId || shelves[0]?.id || "";

  const selectClass =
    "mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Warehouse</Label>
        <select
          value={effectiveWarehouseId}
          onChange={(e) => onWarehouseChange(e.target.value)}
          className={selectClass}
        >
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code} — {warehouse.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Room</Label>
        <select
          value={effectiveRoomId}
          onChange={(e) => onRoomChange(e.target.value)}
          className={selectClass}
          disabled={!effectiveWarehouseId}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.code} — {room.name}
            </option>
          ))}
        </select>
      </div>

      {depth !== "room" && (
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rack</Label>
          <select
            value={effectiveRackId}
            onChange={(e) => onRackChange(e.target.value)}
            className={selectClass}
            disabled={!effectiveRoomId}
          >
            {racks.map((rack) => (
              <option key={rack.id} value={rack.id}>
                {rack.code} — {rack.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {depth === "shelf" && onShelfChange && (
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Shelf</Label>
          <select
            value={effectiveShelfId}
            onChange={(e) => onShelfChange(e.target.value)}
            className={selectClass}
            disabled={!effectiveRackId}
          >
            {shelves.map((shelf) => (
              <option key={shelf.id} value={shelf.id}>
                {shelf.code} — {shelf.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export function useEffectiveHierarchyIds(
  warehouseId: string,
  roomId: string,
  rackId: string,
  shelfId: string,
  depth: HierarchyDepth
) {
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-all"],
    queryFn: () => getWarehouses(1, 100)
  });
  const warehouses = warehousesData?.data || [];
  const effectiveWarehouseId = warehouseId || warehouses[0]?.id || "";

  const { data: roomsData } = useQuery({
    queryKey: ["rooms-all", effectiveWarehouseId],
    queryFn: () => getRooms(effectiveWarehouseId),
    enabled: !!effectiveWarehouseId
  });
  const rooms = roomsData?.data || [];
  const effectiveRoomId = roomId || rooms[0]?.id || "";

  const { data: racksData } = useQuery({
    queryKey: ["racks-all", effectiveRoomId],
    queryFn: () => getRacks(effectiveRoomId),
    enabled: depth !== "room" && !!effectiveRoomId
  });
  const racks = racksData?.data || [];
  const effectiveRackId = rackId || racks[0]?.id || "";

  const { data: shelvesData } = useQuery({
    queryKey: ["shelves-all", effectiveRackId],
    queryFn: () => getShelves(effectiveRackId),
    enabled: depth === "shelf" && !!effectiveRackId
  });
  const shelves = shelvesData?.data || [];
  const effectiveShelfId = shelfId || shelves[0]?.id || "";

  return useMemo(
    () => ({
      effectiveWarehouseId,
      effectiveRoomId,
      effectiveRackId,
      effectiveShelfId
    }),
    [effectiveWarehouseId, effectiveRoomId, effectiveRackId, effectiveShelfId]
  );
}
