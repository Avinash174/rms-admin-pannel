export interface Row {
  id: string;
  roomId: string;
  name: string;
  code: string;
  column?: string | null;
  rowPrefix?: string | null;
  columnsInCell?: number | null;
  capacityOfCell?: number | null;
  floor?: string | null;
  isTemporaryLocation?: boolean;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roomName?: string;
  roomCode?: string;
  roomLocation?: string;
  racks?: Array<{ id: string; name: string; code: string }>;
}

export interface CreateRowRequest {
  column: string;
  rowPrefix: string;
  noOfRows: number;
  columnsInCell: number;
  rackId?: string;
  floor?: string;
  capacityOfCell: number;
  isTemporaryLocation?: boolean;
  description?: string;
  name?: string;
  code?: string;
}

export type UpdateRowRequest = Partial<CreateRowRequest> & {
  isActive?: boolean;
  rackId?: string | null;
};
