export interface Rack {
  id: string;
  name: string;
  code: string;
  description?: string;
  floor?: string;
  roomId: string;
  roomName?: string;
  room?: {
    id: string;
    name: string;
    code: string;
    location?: string | null;
    warehouse?: {
      id: string;
      name: string;
      code: string;
    };
  };
  shelfCount?: number;
  levelCount?: number;
  _count?: {
    shelves: number;
    levels: number;
  };
  companyId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRackRequest {
  name: string;
  code: string;
  description?: string;
  floor?: string;
  roomId: string;
  isActive?: boolean;
}

export interface UpdateRackRequest {
  name?: string;
  code?: string;
  description?: string;
  floor?: string;
  roomId?: string;
  isActive?: boolean;
}

export interface RackListResponse {
  data: Rack[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
