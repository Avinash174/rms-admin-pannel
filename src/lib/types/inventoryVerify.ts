export interface InventoryVerifySession {
  id: string;
  companyId: string;
  operatorId: string;
  boxId: string;
  status: string;
  scansCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryVerifyScan {
  id: string;
  sessionId: string;
  fileBarcode: string;
  clientEventId: string;
  scannedAt: string;
  createdAt: string;
}

export interface StartVerifySessionRequest {
  boxId: string;
}

export interface SubmitVerifyScanRequest {
  fileBarcode: string;
  clientEventId: string;
  scannedAt: string;
}

export interface VerifySessionDetails extends InventoryVerifySession {
  scans: InventoryVerifyScan[];
}
