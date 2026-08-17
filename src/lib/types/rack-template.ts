export type WarehouseTemplateType = 'SMALL' | 'MEDIUM' | 'LARGE' | 'CUSTOM';
export type LocationNamingMode = 'AUTO' | 'MANUAL';
export type MasterRecordStatus = 'ACTIVE' | 'INACTIVE';

export interface RackTemplate {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string | null;
  warehouseType: WarehouseTemplateType;
  rowsCount: number;
  racksCount: number;
  levelsCount: number;
  locRows: number;
  locCols: number;
  locationPerLevel?: number | null;
  locationPerLevelDisplay?: number;
  rowPrefix: string;
  rackPrefix: string;
  levelPrefix: string;
  locationPrefix: string;
  locationPadding: number;
  locationNaming: LocationNamingMode;
  status: MasterRecordStatus;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdByUser?: { id: string; fullName: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface RackTemplateListResponse {
  data: RackTemplate[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PreviewNode {
  label: string;
  children?: PreviewNode[];
}

export interface RackTemplatePreview {
  tree: PreviewNode[];
  summary: {
    rows: number;
    racksPerRow: number;
    levelsPerRack: number;
    locationsPerLevel: number;
    totalLocations: number;
  };
}

export interface CreateRackTemplateRequest {
  name: string;
  code: string;
  description?: string;
  warehouseType: WarehouseTemplateType;
  rowsCount: number;
  racksCount: number;
  levelsCount: number;
  locationPerLevel?: number;
  rowPrefix?: string;
  rackPrefix?: string;
  levelPrefix?: string;
  locationPrefix?: string;
  locationPadding?: number;
  locationNaming?: LocationNamingMode;
  status?: MasterRecordStatus;
}

export type UpdateRackTemplateRequest = Partial<CreateRackTemplateRequest>;
