export interface RoomRow {
  id: string;
  name: string;
  code: string;
  roomId: string;
  column?: string | null;
  rowPrefix?: string | null;
  columnsInCell?: number | null;
  capacityOfCell?: number | null;
  floor?: string | null;
  isTemporaryLocation?: boolean;
  description?: string | null;
  isActive?: boolean;
  racks?: Array<{ id: string; name: string; code: string }>;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  warehouseId: string;
  warehouseName?: string;
  warehouse?: {
    id: string;
    name: string;
    code: string;
  };
  rows?: RoomRow[];
  rowCount?: number;
  rackCount?: number;
  locationCount?: number;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  name: string;
  code: string;
  description?: string;
  location?: string;
  warehouseId: string;
  isActive?: boolean;
}

export interface UpdateRoomRequest {
  name?: string;
  code?: string;
  description?: string;
  location?: string;
  warehouseId?: string;
  isActive?: boolean;
}

export interface RoomListResponse {
  data: Room[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
