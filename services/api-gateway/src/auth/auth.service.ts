// ================================================================
// Auth Service — Gateway Side (gRPC CLIENT caller)
// ================================================================
// This service is the BRIDGE between HTTP and gRPC.
//
// It injects the gRPC client (registered in auth.module.ts),
// gets a reference to the AuthService defined in auth.proto,
// and calls its methods: Register() and Login().
//
// FLOW:
//   1. Controller receives HTTP POST /auth/register
//   2. Controller calls this service's register() method
//   3. This service calls authGrpcService.register() over gRPC
//   4. Auth Service (gRPC server) processes it, returns response
//   5. This service returns the gRPC response back to controller
//   6. Controller sends it as HTTP JSON response to the browser
//
// KEY CONCEPT: OnModuleInit
//   The gRPC client connection is established when the module
//   initializes. onModuleInit() runs AFTER NestJS sets up all
//   dependencies. We use it to get the gRPC service reference.
// ================================================================

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, map, Observable, timeout } from 'rxjs';

// -------------------------------------------------------
// TypeScript interfaces matching the proto messages
// -------------------------------------------------------
// These mirror what's in auth.proto, but in TypeScript.
// gRPC auto-converts snake_case (proto) → camelCase (JS).
// -------------------------------------------------------

interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface GetProfileRequest {
  userId: string;
}

interface UpdateProfileRequest {
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

interface RevokeRefreshTokenRequest {
  userId: string;
}

interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponse {
  available: boolean;
}

interface ListFarmsRequest {
  userId: string;
  page: number;
  limit: number;
  status?: string;
}

interface GetInvitationRequest {
  token: string;
}

interface AcceptInvitationRequest {
  token: string;
  userId: string;
  user_id?: string;
}

interface ListUserInvitationsRequest {
  userId: string;
  user_id?: string;
}

interface RejectInvitationRequest {
  token: string;
  userId: string;
  user_id?: string;
}

export interface UserInvitationRow {
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

export interface ListUserInvitationsResponse {
  invitations: UserInvitationRow[];
}

interface InviteWorkerRequest {
  farmId: string;
  inviterId: string;
  email: string;
  role?: string;
}

interface ListFarmMembersRequest {
  farmId: string;
  userId: string;
  page?: number;
  limit?: number;
  status?: string;
}

interface FarmMemberRow {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  status?: string;
  joinedAt?: string;
  joinDate?: string;
}

export interface ListFarmMembersResponse {
  members: FarmMemberRow[];
  total: number;
  page: number;
  limit: number;
}

interface RemoveFarmMemberRequest {
  farmId: string;
  ownerId: string;
  memberId: string;
}

interface LinkUserToFarmRequest {
  userId: string;
  farmId: string;
  role?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface FarmInfo {
  id: string;
  name: string;
  schemaName: string;
  status: string;
  createdAt: string;
  location?: string;
  address?: string;
}

export interface FarmMembership {
  farm?: FarmInfo;
  role?: string;
}

type RawFarmMembership = {
  farm?: {
    id?: string;
    name?: string;
    location?: string;
    address?: string;
    schemaName?: string;
    schema_name?: string;
    status?: string;
    createdAt?: string;
    created_at?: string;
  };
  farmId?: string;
  farm_id?: string;
  id?: string;
  name?: string;
  location?: string;
  address?: string;
  schemaName?: string;
  schema_name?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  role?: string;
};

interface ListFarmsResponse {
  farms?: FarmMembership[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface AuthResponse {
  message: string;
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
  currentFarm?: FarmInfo;
}

// -------------------------------------------------------
// This interface represents the AuthService FROM the proto.
// It defines the methods we can call on the REMOTE service.
// -------------------------------------------------------
interface AuthGrpcService {
  register(data: RegisterRequest): Observable<AuthResponse>;
  login(data: LoginRequest): Observable<AuthResponse>;
  refreshToken(data: RefreshTokenRequest): Observable<AuthResponse>;
  getProfile(data: GetProfileRequest): Observable<UserInfo>;
  updateProfile(data: UpdateProfileRequest): Observable<UserInfo>;
  changePassword(data: ChangePasswordRequest): Observable<{ success: boolean }>;
  revokeRefreshToken(
    data: RevokeRefreshTokenRequest,
  ): Observable<{ success: boolean }>;
  checkEmailAvailability(
    data: CheckEmailRequest,
  ): Observable<CheckEmailResponse>;
  listFarms(data: ListFarmsRequest): Observable<ListFarmsResponse>;
  listOwnerFarms(data: ListFarmsRequest): Observable<ListFarmsResponse>;
  getInvitation(data: GetInvitationRequest): Observable<any>;
  acceptInvitationForUser(data: AcceptInvitationRequest): Observable<any>;
  listUserInvitations(
    data: ListUserInvitationsRequest,
  ): Observable<ListUserInvitationsResponse>;
  rejectInvitationForUser(
    data: RejectInvitationRequest,
  ): Observable<{ success: boolean; message?: string }>;
  inviteWorker(data: InviteWorkerRequest): Observable<any>;
  listFarmMembers(
    data: ListFarmMembersRequest,
  ): Observable<ListFarmMembersResponse>;
  removeFarmMember(data: RemoveFarmMemberRequest): Observable<any>;
  linkUserToFarm(data: LinkUserToFarmRequest): Observable<{ success: boolean }>;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private authGrpcService!: AuthGrpcService;

  // -------------------------------------------------------
  // @Inject('USER_SERVICE') → inject the gRPC client
  // -------------------------------------------------------
  // 'USER_SERVICE' matches the `name` in ClientsModule.register()
  // from auth.module.ts. ClientGrpc is the raw gRPC client.
  // -------------------------------------------------------
  constructor(@Inject('USER_SERVICE') private readonly client: ClientGrpc) {}

  // -------------------------------------------------------
  // onModuleInit — get the gRPC service reference
  // -------------------------------------------------------
  // client.getService<T>('AuthService') looks at the proto file
  // and creates a proxy object with methods matching the RPCs.
  //
  // After this line, authGrpcService has:
  //   .register() → calls the Register RPC
  //   .login()    → calls the Login RPC
  //
  // 'UserService' must match the service name in user.proto:
  //   service UserService { ... }
  // -------------------------------------------------------
  onModuleInit() {
    this.authGrpcService =
      this.client.getService<AuthGrpcService>('UserService');
  }

  // -------------------------------------------------------
  // Register — forward to gRPC
  // -------------------------------------------------------
  // gRPC methods in NestJS return Observables (RxJS).
  // firstValueFrom() converts Observable → Promise so we
  // can use async/await as usual.
  // -------------------------------------------------------
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Pass data directly - gRPC/protobufjs handles camelCase to snake_case conversion
    return firstValueFrom(
      this.authGrpcService.register(data).pipe(timeout(15000)),
    );
  }

  // -------------------------------------------------------
  // Login — forward to gRPC
  // -------------------------------------------------------
  async login(data: LoginRequest): Promise<AuthResponse> {
    return firstValueFrom(
      this.authGrpcService.login(data).pipe(timeout(15000)),
    );
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return firstValueFrom(
      this.authGrpcService.refreshToken({ refreshToken }).pipe(timeout(15000)),
    );
  }

  async getProfile(userId: string): Promise<UserInfo> {
    return firstValueFrom(
      this.authGrpcService
        .getProfile({ userId, user_id: userId } as GetProfileRequest & {
          user_id: string;
        })
        .pipe(timeout(15000)),
    );
  }

  async updateProfile(
    userId: string,
    data: Partial<UserInfo>,
  ): Promise<UserInfo> {
    return firstValueFrom(
      this.authGrpcService
        .updateProfile({
          userId,
          firstName: data.firstName,
          lastName: data.lastName,
        })
        .pipe(timeout(15000)),
    );
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await firstValueFrom(
      this.authGrpcService
        .changePassword({ userId, currentPassword, newPassword })
        .pipe(timeout(15000)),
    );
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await firstValueFrom(
      this.authGrpcService.revokeRefreshToken({ userId }).pipe(timeout(15000)),
    );
  }

  async checkEmailAvailability(email: string): Promise<CheckEmailResponse> {
    return firstValueFrom(
      this.authGrpcService
        .checkEmailAvailability({ email })
        .pipe(timeout(15000)),
    );
  }

  async listUserFarms(
    userId: string,
    options?: { suppressErrors?: boolean },
  ): Promise<FarmMembership[]> {
    const suppressErrors = options?.suppressErrors ?? true;

    try {
      const response = await firstValueFrom(
        this.authGrpcService
          .listFarms({ userId, page: 1, limit: 1000 })
          .pipe(timeout(15000)),
      );

      const farms = response?.farms;
      let rawMemberships: RawFarmMembership[] = [];

      if (Array.isArray(farms)) {
        rawMemberships = farms;
      } else if (farms && typeof farms === 'object') {
        rawMemberships = Object.values(farms);
      }

      const normalized = rawMemberships
        .map((membership) => this.normalizeFarmMembership(membership))
        .filter(
          (membership): membership is FarmMembership =>
            typeof membership?.farm?.id === 'string' &&
            membership.farm.id.length > 0,
        );

      return normalized;
    } catch (error) {
      if (!suppressErrors) {
        throw new InternalServerErrorException('farm.unable_to_load', {
          cause: error,
        });
      }

      // Membership checks should fail closed (403) instead of bubbling internal errors.
      return [];
    }
  }

  async listOwnedFarms(
    userId: string,
    options?: { suppressErrors?: boolean },
  ): Promise<FarmMembership[]> {
    const suppressErrors = options?.suppressErrors ?? true;

    try {
      const response = await firstValueFrom(
        this.authGrpcService
          .listOwnerFarms({ userId, page: 1, limit: 1000 })
          .pipe(timeout(15000)),
      );

      const farms = response?.farms;
      let rawMemberships: RawFarmMembership[] = [];

      if (Array.isArray(farms)) {
        rawMemberships = farms;
      } else if (farms && typeof farms === 'object') {
        rawMemberships = Object.values(farms);
      }

      return rawMemberships
        .map((membership) => this.normalizeFarmMembership(membership))
        .filter(
          (membership): membership is FarmMembership =>
            typeof membership?.farm?.id === 'string' &&
            membership.farm.id.length > 0,
        );
    } catch (error) {
      if (!suppressErrors) {
        throw new InternalServerErrorException('farm.unable_to_load_owner', {
          cause: error,
        });
      }

      return [];
    }
  }

  private normalizeFarmMembership(
    membership: RawFarmMembership,
  ): FarmMembership | null {
    const farmSource = membership.farm;
    const farmId =
      farmSource?.id ??
      membership.farmId ??
      membership.farm_id ??
      membership.id;

    if (typeof farmId !== 'string' || farmId.length === 0) {
      return null;
    }

    const farm: FarmInfo = {
      id: farmId,
      name: farmSource?.name ?? membership.name ?? '',
      location:
        farmSource?.location ?? farmSource?.address ?? membership.location,
      address:
        farmSource?.address ?? farmSource?.location ?? membership.address,
      schemaName:
        farmSource?.schemaName ??
        farmSource?.schema_name ??
        membership.schemaName ??
        membership.schema_name ??
        '',
      status: farmSource?.status ?? membership.status ?? '',
      createdAt:
        farmSource?.createdAt ??
        farmSource?.created_at ??
        membership.createdAt ??
        membership.created_at ??
        '',
    };

    return {
      farm,
      role: membership.role,
    };
  }

  async linkUserToFarm(
    userId: string,
    farmId: string,
    role = 'OWNER',
  ): Promise<void> {
    await firstValueFrom(
      this.authGrpcService
        .linkUserToFarm({ userId, farmId, role })
        .pipe(timeout(15000)),
    );
  }

  async getInvitation(token: string): Promise<any> {
    return firstValueFrom(
      this.authGrpcService.getInvitation({ token }).pipe(timeout(15000)),
    );
  }

  async acceptInvitationForUser(token: string, userId: string): Promise<any> {
    return firstValueFrom(
      this.authGrpcService
        .acceptInvitationForUser({ token, userId, user_id: userId })
        .pipe(timeout(15000)),
    );
  }

  async listUserInvitations(
    userId: string,
  ): Promise<ListUserInvitationsResponse> {
    return firstValueFrom(
      this.authGrpcService
        .listUserInvitations({ userId, user_id: userId })
        .pipe(
          timeout(15000),
          map((response: any) => ({
            invitations: (response.invitations || []).map((inv: any) => ({
              id: inv.id,
              token: inv.token,
              // Handle both snake_case (proto default) and camelCase (grpc-js default)
              farmId: inv.farmId || inv.farm_id,
              farmName: inv.farmName || inv.farm_name || 'Unknown Farm',
              role: inv.role,
              status: inv.status,
              inviterId: inv.inviterId || inv.inviter_id,
              inviterName: inv.inviterName || inv.inviter_name || 'Unknown',
              email: inv.email,
              expiresAt: inv.expiresAt || inv.expires_at,
              createdAt: inv.createdAt || inv.created_at,
            })),
          })),
        ),
    );
  }

  async rejectInvitationForUser(
    token: string,
    userId: string,
  ): Promise<{ success: boolean; message?: string }> {
    return firstValueFrom(
      this.authGrpcService
        .rejectInvitationForUser({ token, userId, user_id: userId })
        .pipe(timeout(15000)),
    );
  }

  async inviteWorker(
    farmId: string,
    inviterId: string,
    email: string,
    role = 'WORKER',
  ): Promise<any> {
    return firstValueFrom(
      this.authGrpcService
        .inviteWorker({ farmId, inviterId, email, role })
        .pipe(timeout(15000)),
    );
  }

  async listFarmMembers(
    farmId: string,
    userId: string,
    options?: { page?: number; limit?: number; status?: string },
  ): Promise<ListFarmMembersResponse> {
    return firstValueFrom(
      this.authGrpcService
        .listFarmMembers({
          farmId,
          userId,
          page: options?.page,
          limit: options?.limit,
          status: options?.status,
        })
        .pipe(
          timeout(15000),
          map((response: any) => ({
            ...response,
            members: (response.members || []).map((m: any) => ({
              userId: m.userId || m.user_id,
              email: m.email,
              firstName: m.firstName || m.first_name,
              lastName: m.lastName || m.last_name,
              phone: m.phone,
              role: m.role,
              status: m.status,
              joinedAt: m.joinedAt || m.joined_at,
              joinDate: m.joinDate || m.join_date,
            })),
          })),
        ),
    );
  }

  async removeFarmMember(
    farmId: string,
    ownerId: string,
    memberId: string,
  ): Promise<any> {
    return firstValueFrom(
      this.authGrpcService
        .removeFarmMember({ farmId, ownerId, memberId })
        .pipe(timeout(15000)),
    );
  }
}
