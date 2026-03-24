import api from '@/lib/axios';

// ================================================================
// Farm API
// ================================================================

export interface CreateFarmPayload {
  name: string;
  address?: string;
  type?: string;
}

export interface FarmResponse {
  id: string;
  name: string;
  address?: string;
  type?: string;
  schemaName: string;
  status: string;
  createdAt: string;
}

export interface FarmSummary {
  id: string;
  name: string;
  location?: string;
  address?: string;
  schemaName?: string;
  status?: string;
  createdAt?: string;
  role?: 'OWNER' | 'WORKER' | string;
}

export interface CreateFarmResponse {
  message: string;
  farm: FarmResponse;
  createdByUserId: string;
}

export async function createFarm(
  data: CreateFarmPayload,
): Promise<CreateFarmResponse> {
  const response = await api.post<CreateFarmResponse>('/farms', data);
  return response.data;
}

export async function listFarms(): Promise<FarmSummary[]> {
  const response = await api.get<FarmSummary[]>('/farms');
  return response.data;
}

export async function listOwnedFarms(): Promise<FarmSummary[]> {
  const response = await api.get<FarmSummary[]>('/farms/owned');
  return response.data;
}

// ================================================================
// Group API
// ================================================================

export interface CreateGroupPayload {
  name: string;
  type: string;
  species?: string;
  breed: string;
  arrivalDate: string;
  initialQuantity: number;
  farmId: string;
}

export interface GroupResponse {
  id: string;
  name: string;
  type: string;
  initialQuantity: number;
  currentQuantity: number;
  arrivalDate: string;
  breed: string;
  building: string;
  status: string;
  createdAt: string;
}

export interface CreateGroupResponse {
  message: string;
  group: GroupResponse;
}

export async function createGroup(
  data: CreateGroupPayload,
): Promise<CreateGroupResponse> {
  const response = await api.post<CreateGroupResponse>(
    '/production/groups',
    data,
  );
  return response.data;
}
