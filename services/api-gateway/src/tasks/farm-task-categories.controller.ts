import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthenticatedRequest, JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FarmAccessGuard } from '../guards/farm-access.guard';
import { createGrpcMetadata } from '../common/utils/grpc-helpers';
import { TaskServiceClient } from './tasks.interface';

@Controller('farms/:farmId/task-categories')
@UseGuards(JwtAuthGuard, FarmAccessGuard)
export class FarmTaskCategoriesController implements OnModuleInit {
  private tasksService!: TaskServiceClient;

  constructor(@Inject('TASKS_SERVICE') private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.tasksService =
      this.client.getService<TaskServiceClient>('TaskService');
  }

  @Get()
  async listCategories(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return firstValueFrom(
      this.tasksService.listCategories(
        { farmId },
        createGrpcMetadata(req.user, farmId, req.farmMembership?.role),
      ),
    );
  }

  @Post()
  async createCategory(
    @Param('farmId') farmId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: { name: string; color?: string },
  ) {
    return firstValueFrom(
      this.tasksService.createCategory(
        {
          farmId,
          name: body.name,
          color: body.color || '',
        },
        createGrpcMetadata(req.user, farmId, req.farmMembership?.role),
      ),
    );
  }

  @Delete(':id')
  async deleteCategory(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return firstValueFrom(
      this.tasksService.deleteCategory(
        {
          categoryId: id,
          farmId,
        },
        createGrpcMetadata(req.user, farmId, req.farmMembership?.role),
      ),
    );
  }
}
