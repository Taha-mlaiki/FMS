import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Invitation, InvitationStatus } from './entities/invitation.entity';

import { UserFarm, FarmRole } from './entities/user-farm.entity';
import { UsersService } from '../users/users.service';
import { FarmsService } from './farms.service';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(UserFarm)
    private readonly userFarmRepository: Repository<UserFarm>,
    private readonly usersService: UsersService,
    private readonly farmsService: FarmsService,
  ) {}

  async getInvitationByToken(token: string): Promise<any> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('invitation.not_found');
    }

    const farm = await this.farmsService.findById(invitation.farmId);

    return {
      farmName: farm?.name ?? 'Farm',
      inviterName: invitation.inviterId,
      role: invitation.role,
      expiresAt: invitation.expiresAt.toISOString(),
      status: invitation.status,
    };
  }

  async createInvitation(
    farmId: string,
    inviterId: string,
    email: string,
    role: string = 'WORKER',
  ): Promise<Invitation> {
    this.logger.log(`Creating invitation for ${email} to farm ${farmId}`);

    // Check if an active invitation already exists
    const existing = await this.invitationRepository.findOne({
      where: { email, farmId, status: InvitationStatus.PENDING },
    });

    if (existing) {
      return existing;
    }

    const invitation = this.invitationRepository.create({
      email,
      farmId,
      inviterId,
      role,

      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return this.invitationRepository.save(invitation);
  }

  async acceptInvitation(token: string, userData: any): Promise<any> {
    const invitation = await this.invitationRepository.findOne({
      where: { token, status: InvitationStatus.PENDING },
    });

    if (!invitation) {
      throw new NotFoundException('invitation.not_found_or_processed');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new ConflictException('invitation.expired');
    }

    // 1. Find or create the user
    let user = await this.usersService.findByEmail(invitation.email);
    user ??= await this.usersService.create(
      {
        email: invitation.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
      userData.password,
    );

    // 2. Link user to farm
    const membership = this.userFarmRepository.create({
      user,
      farmId: invitation.farmId,
      role: (invitation.role as FarmRole) || FarmRole.WORKER,
      isActive: true,
    });
    await this.userFarmRepository.save(membership);

    // 3. Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    return { user, farmId: invitation.farmId };
  }

  async acceptInvitationForExistingUser(
    token: string,
    userId: string,
  ): Promise<any> {
    const invitation = await this.invitationRepository.findOne({
      where: { token, status: InvitationStatus.PENDING },
    });

    if (!invitation) {
      throw new NotFoundException('invitation.not_found_or_processed');
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new ConflictException('invitation.expired');
    }

    const existingMembership = await this.userFarmRepository.findOne({
      where: { farmId: invitation.farmId, userId },
    });

    if (!existingMembership) {
      const membership = this.userFarmRepository.create({
        userId,
        farmId: invitation.farmId,
        role: (invitation.role as FarmRole) || FarmRole.WORKER,
        isActive: true,
      });
      await this.userFarmRepository.save(membership);
    }

    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    return {
      farmId: invitation.farmId,
      role: invitation.role,
    };
  }

  async listUserInvitationsByEmail(email: string) {
    if (!email || email.trim().length === 0) {
      return [];
    }

    const normalizedEmail = email.trim().toLowerCase();
    const invitations = await this.invitationRepository
      .createQueryBuilder('invitation')
      .where('LOWER(invitation.email) = :email', { email: normalizedEmail })
      .orderBy('invitation.createdAt', 'DESC')
      .getMany();

    if (invitations.length === 0) {
      return [];
    }

    const farmIds = Array.from(new Set(invitations.map((item) => item.farmId)));
    const inviterIds = Array.from(
      new Set(invitations.map((item) => item.inviterId).filter(Boolean)),
    );

    const [farmPairs, inviterPairs] = await Promise.all([
      Promise.all(
        farmIds.map(async (farmId) => {
          const farm = await this.farmsService
            .findById(farmId)
            .catch(() => null);
          return [farmId, farm?.name ?? 'Farm'] as const;
        }),
      ),
      Promise.all(
        inviterIds.map(async (inviterId) => {
          const inviter = await this.usersService
            .findById(inviterId)
            .catch(() => null);
          const inviterName = inviter
            ? `${inviter.firstName ?? ''} ${inviter.lastName ?? ''}`.trim() ||
              inviter.email ||
              inviterId
            : inviterId;
          return [inviterId, inviterName] as const;
        }),
      ),
    ]);

    const farmNamesById = new Map(farmPairs);
    const inviterNamesById = new Map(inviterPairs);

    return invitations.map((invitation) => ({
      id: invitation.id,
      token: invitation.token,
      farmId: invitation.farmId,
      farm_id: invitation.farmId,
      farmName: farmNamesById.get(invitation.farmId) ?? 'Farm',
      farm_name: farmNamesById.get(invitation.farmId) ?? 'Farm',
      role: invitation.role,
      status: invitation.status,
      inviterId: invitation.inviterId,
      inviter_id: invitation.inviterId,
      inviterName:
        inviterNamesById.get(invitation.inviterId) ?? invitation.inviterId,
      inviter_name:
        inviterNamesById.get(invitation.inviterId) ?? invitation.inviterId,
      email: invitation.email,
      expiresAt: invitation.expiresAt.toISOString(),
      expires_at: invitation.expiresAt.toISOString(),
      createdAt: invitation.createdAt.toISOString(),
      created_at: invitation.createdAt.toISOString(),
    }));
  }

  async rejectInvitationForExistingUser(token: string, email: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token, status: InvitationStatus.PENDING },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      throw new ForbiddenException('invitation.can_only_reject_own');
    }

    invitation.status = InvitationStatus.REJECTED;
    await this.invitationRepository.save(invitation);

    return { success: true, message: 'invitation.rejected' };
  }

  async listMembers(farmId: string) {
    return this.userFarmRepository.find({
      where: { farmId },
      relations: ['user'],
    });
  }

  async listWorkers(
    farmId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: 'pending' | 'active' | 'inactive';
    },
  ) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 10));
    const statusFilter = options?.status;

    const [memberships, pendingInvitations] = await Promise.all([
      this.userFarmRepository.find({
        where: { farmId },
        relations: ['user'],
        order: { joinedAt: 'DESC' },
      }),
      this.invitationRepository.find({
        where: { farmId, status: InvitationStatus.PENDING },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const workerMemberships = memberships.filter(
      (membership) => membership.role !== FarmRole.OWNER,
    );

    const activeEmails = new Set(
      workerMemberships
        .map((membership) => membership.user?.email?.toLowerCase())
        .filter((email): email is string => Boolean(email)),
    );

    const memberRows = workerMemberships.map((membership) => {
      const joinedAt = membership.joinedAt?.toISOString?.() ?? '';
      const status = membership.isActive ? 'active' : 'inactive';
      const firstName = membership.user?.firstName ?? '';
      const lastName = membership.user?.lastName ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      const userId = membership.userId ?? '';

      return {
        id: userId,
        userId,
        user_id: userId,
        email: membership.user?.email ?? '',
        firstName,
        first_name: firstName,
        lastName,
        last_name: lastName,
        fullName,
        full_name: fullName,
        phone: membership.user?.phoneNumber ?? '',
        role: membership.role,
        status,
        joinedAt,
        joined_at: joinedAt,
        joinDate: joinedAt,
        join_date: joinedAt,
        sort_date: joinedAt,
      };
    });

    const pendingRows = pendingInvitations
      .filter((invitation) => !activeEmails.has(invitation.email.toLowerCase()))
      .map((invitation) => {
        const createdAt = invitation.createdAt?.toISOString?.() ?? '';
        return {
          id: '',
          userId: '',
          user_id: '',
          email: invitation.email,
          firstName: '',
          first_name: '',
          lastName: '',
          last_name: '',
          fullName: '',
          full_name: '',
          phone: '',
          role: invitation.role,
          status: 'pending',
          joinedAt: '',
          joined_at: '',
          joinDate: '',
          join_date: '',
          sort_date: createdAt,
        };
      });

    const combined = [...memberRows, ...pendingRows].sort((left, right) => {
      return right.sort_date.localeCompare(left.sort_date);
    });

    const filtered = statusFilter
      ? combined.filter((row) => row.status === statusFilter)
      : combined;

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const members = filtered.slice(offset, offset + limit).map((member) => ({
      id: member.id,
      userId: member.userId,
      user_id: member.user_id,
      email: member.email,
      firstName: member.firstName,
      first_name: member.first_name,
      lastName: member.lastName,
      last_name: member.last_name,
      fullName: member.fullName,
      full_name: member.full_name,
      phone: member.phone,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
      joined_at: member.joined_at,
      joinDate: member.joinDate,
      join_date: member.join_date,
    }));

    return {
      members,
      total,
      page,
      limit,
    };
  }

  async removeMember(farmId: string, memberId: string) {
    const membership = await this.userFarmRepository.findOne({
      where: { farmId, userId: memberId },
    });
    if (membership) {
      membership.isActive = false;
      await this.userFarmRepository.save(membership);
    }
  }
}
