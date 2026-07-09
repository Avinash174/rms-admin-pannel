export interface RefileResult {
  fileRecordId: string;
  fileBarcode: string;
  boxId: string;
  locationId: string;
  status: string;
  createdAt: string;
}

export interface SubmitRefileScanRequest {
  fileBarcode: string;
  scannedBoxBarcode: string;
  scannedLocationBarcode: string;
  clientEventId: string;
  scannedAt: string;
}
