export interface FileRecord {
  id: string;
  barcode: string;
  title: string;
  description?: string;
  referenceNumber?: string;
  boxId: string;
  boxBarcode?: string;
  clientId: string;
  clientName?: string;
  departmentId?: string;
  departmentName?: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFileRecordRequest {
  barcode: string;
  title: string;
  description?: string;
  referenceNumber?: string;
  boxId: string;
  clientId: string;
  departmentId?: string;
  isActive?: boolean;
}

export interface UpdateFileRecordRequest {
  barcode?: string;
  title?: string;
  description?: string;
  referenceNumber?: string;
  boxId?: string;
  clientId?: string;
  departmentId?: string;
  isActive?: boolean;
}

export interface FileRecordListResponse {
  data: FileRecord[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
