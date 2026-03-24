import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TaskSchedulerService } from './task-scheduler.service';
import { TaskGeneratorService } from './task-generator.service';
import { TaskCronService } from './task-cron.service';
import { Task } from './entities/task.entity';
import { TaskTemplate } from './entities/task-template.entity';
import { TaskCategory } from './entities/task-category.entity';

import { DatabaseModule } from '@shared/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskTemplate, TaskCategory]),
    DatabaseModule,
  ],
  controllers: [TasksController],
  providers: [
    TasksService,
    TaskSchedulerService,
    TaskGeneratorService,
    TaskCronService,
  ],
  exports: [TasksService],
})
export class TasksModule {}
