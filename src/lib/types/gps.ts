export interface GpsPing {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  userId: string;
  deviceId: string;
  createdAt: string;
}

export interface LastKnownLocation {
  userId: string;
  userName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface LiveUserLocation {
  userId: string;
  userName: string;
  userEmail: string;
  deviceId: string;
  deviceName?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  updatedAt: string;
}
