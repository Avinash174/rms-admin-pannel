export interface FileRecord {
  id: string;
  barcode: string;
  title?: string;
  referenceNumber?: string;
  description?: string;
  status: string;
  boxId: string;
  boxBarcode?: string;
  clientId?: string;
  clientName?: string;
  departmentId?: string;
  departmentName?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFileRecordRequest {
  barcode: string;
  title?: string;
  boxId: string;
}

export interface UpdateFileRecordRequest {
  barcode?: string;
  title?: string;
  status?: string;
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
