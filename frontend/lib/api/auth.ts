import api from '@/lib/axios';
import type {
  LoginFormData,
  RegisterFormData,
} from '@/lib/validations/auth.schema';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  first_name?: string;
  lastName: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
}

export interface AuthFarm {
  id: string;
  name: string;
  schemaName: string;
  schema_name?: string;
  status: string;
  createdAt: string;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: AuthUser;
  currentFarm?: AuthFarm;
  current_farm?: AuthFarm;
}

export interface RefreshSessionResponse {
  accessToken: string;
  currentFarm?: AuthFarm;
  current_farm?: AuthFarm;
}

export interface ProfileResponse extends AuthUser {
  fullName?: string;
}

export interface UpdateMePayload {
  fullName?: string;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
}

export async function loginUser(data: LoginFormData): Promise<AuthResponse> {
  const payload =
    data.method === 'email'
      ? { email: data.email, password: data.password }
      : { phone: data.phone, password: data.password };

  const response = await api.post<AuthResponse>('/auth/login', payload, {
    withCredentials: true,
  });
  return response.data;
}

export async function registerUser(
  data: RegisterFormData,
): Promise<AuthResponse> {
  const [firstName, ...lastParts] = data.fullName.trim().split(' ');
  const lastName = lastParts.join(' ') || firstName;

  const response = await api.post<AuthResponse>(
    '/auth/register',
    {
      firstName,
      lastName,
      email: data.email,
      phone: data.phone || undefined,
      role: data.role,
      password: data.password,
    },
    { withCredentials: true },
  );
  return response.data;
}

export async function refreshSession(): Promise<RefreshSessionResponse> {
  const response = await api.post<RefreshSessionResponse>(
    '/auth/refresh',
    {},
    { withCredentials: true },
  );
  return response.data;
}

export async function getMe(): Promise<ProfileResponse> {
  const response = await api.get<ProfileResponse>('/auth/me', {
    withCredentials: true,
  });
  return response.data;
}

export async function logoutUser(): Promise<void> {
  await api.post('/auth/logout', {}, { withCredentials: true });
}

export async function updateMe(data: UpdateMePayload): Promise<ProfileResponse> {
  const response = await api.patch<ProfileResponse>('/auth/me', data, {
    withCredentials: true,
  });
  return response.data;
}

export async function changePassword(
  data: ChangePasswordPayload,
): Promise<void> {
  await api.post('/auth/change-password', data, { withCredentials: true });
}

// ================================================================
// Invitation API
// ================================================================

export interface UserInvitation {
  id: string;
  token: string;
  farmId: string;
  farmName: string;
  role: string;
  status: string;
  inviterId: string;
  inviterName: string;
  email: string;
  expiresAt: string;
  createdAt: string;
}

export interface ListInvitationsResponse {
  invitations: UserInvitation[];
}

export async function listInvitations(): Promise<UserInvitation[]> {
  const response = await api.get<ListInvitationsResponse>('/invitations/my');
  return response.data.invitations;
}

export async function acceptInvitation(token: string): Promise<unknown> {
  const response = await api.post(`/invitations/${token}/accept`);
  return response.data;
}

export async function rejectInvitation(token: string): Promise<unknown> {
  const response = await api.post(`/invitations/${token}/reject`);
  return response.data;
}
