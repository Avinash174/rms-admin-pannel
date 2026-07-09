export interface SegregationResult {
  sessionId: string;
  oldBoxId: string;
  newBoxId: string;
  filesMoved: number;
  status: string;
  createdAt: string;
}

export interface MergeResult {
  sourceBoxId: string;
  targetBoxId: string;
  filesMerged: number;
  status: string;
  createdAt: string;
}

export interface Transfer {
  id: string;
  boxId: string;
  boxBarcode: string;
  destinationLocation: string;
  reason?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SegregateBoxRequest {
  oldBoxId: string;
  newBoxId: string;
  fileRecordIds: string[];
}

export interface MergeBoxesRequest {
  sourceBoxId: string;
  targetBoxId: string;
}

export interface InitiateTransferRequest {
  boxBarcode: string;
  destinationLocation: string;
  reason?: string;
}
