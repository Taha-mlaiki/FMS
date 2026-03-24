import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { AuthenticatedRequest, JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly authService: AuthService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List invitations for the logged-in user' })
  listMyInvitations(@Req() req: AuthenticatedRequest) {
    return this.authService.listUserInvitations(req.user.sub);
  }

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Get invitation details by token' })
  getInvitation(@Param('token') token: string) {
    return this.authService.getInvitation(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Accept invitation for logged-in user' })
  acceptInvitation(
    @Param('token') token: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.acceptInvitationForUser(token, req.user.sub);
  }

  @Post(':token/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Reject invitation for logged-in user' })
  rejectInvitation(
    @Param('token') token: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.rejectInvitationForUser(token, req.user.sub);
  }
}
