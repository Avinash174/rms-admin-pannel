export interface Room {
  id: string;
  name: string;
  code: string;
  description?: string;
  warehouseId: string;
  warehouseName?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  name: string;
  code: string;
  description?: string;
  warehouseId: string;
  isActive?: boolean;
}

export interface UpdateRoomRequest {
  name?: string;
  code?: string;
  description?: string;
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
