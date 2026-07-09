export interface FreshBoxMoveSession {
  id: string;
  operatorId: string;
  deviceId?: string;
  status: string;
  scansCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FreshBoxMoveScan {
  id: string;
  sessionId: string;
  locationBarcode: string;
  boxBarcode: string;
  clientEventId: string;
  gpsLat?: number;
  gpsLng?: number;
  scannedAt: string;
  createdAt: string;
}

export interface StartSessionRequest {
  deviceId?: string;
}

export interface SubmitScanRequest {
  locationBarcode: string;
  boxBarcode: string;
  clientEventId: string;
  gpsLat?: number;
  gpsLng?: number;
  scannedAt: string;
}

export interface SessionDetails extends FreshBoxMoveSession {
  scans: FreshBoxMoveScan[];
}
