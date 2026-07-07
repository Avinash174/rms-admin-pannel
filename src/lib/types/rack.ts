export interface Rack {
  id: string;
  name: string;
  code: string;
  description?: string;
  roomId: string;
  roomName?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRackRequest {
  name: string;
  code: string;
  description?: string;
  roomId: string;
  isActive?: boolean;
}

export interface UpdateRackRequest {
  name?: string;
  code?: string;
  description?: string;
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
