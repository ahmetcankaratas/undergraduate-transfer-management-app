import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole } from '../../common/enums';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  FilterApplicationDto,
} from './dto';

@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  async create(
    @CurrentUser() user: any,
    @Body() createDto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(user.id, createDto);
  }

  @Get()
  async findAll(@Query() filters: FilterApplicationDto, @CurrentUser() user: any) {
    return this.applicationsService.findAll(filters, user);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.OIDB_STAFF)
  async getStatistics() {
    return this.applicationsService.getStatistics();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicationsService.findOne(id, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.update(id, updateDto, user);
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  async submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicationsService.submit(id, user);
  }

  @Post(':id/review')
  @Roles(UserRole.OIDB_STAFF)
  async review(
    @Param('id') id: string,
    @Body() body: { approved: boolean; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.review(id, user.id, body.approved, body.notes);
  }

  @Post(':id/route-to-faculty')
  @Roles(UserRole.OIDB_STAFF)
  async routeToFaculty(@Param('id') id: string) {
    return this.applicationsService.routeToFaculty(id);
  }

  @Post(':id/route-to-department')
  @Roles(UserRole.FACULTY_STAFF)
  async routeToDepartment(@Param('id') id: string) {
    return this.applicationsService.routeToDepartment(id);
  }

  @Post(':id/set-for-evaluation')
  @Roles(UserRole.FACULTY_STAFF)
  async setForEvaluation(@Param('id') id: string) {
    return this.applicationsService.setForEvaluation(id);
  }

  @Post(':id/faculty-board-decision')
  @Roles(UserRole.FACULTY_STAFF)
  async setFacultyBoardDecision(
    @Param('id') id: string,
    @Body() body: { decision: string; notes?: string },
  ) {
    return this.applicationsService.setFacultyBoardDecision(
      id,
      body.decision,
      body.notes,
    );
  }

  @Delete(':id')
  @Roles(UserRole.STUDENT)
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicationsService.delete(id, user);
  }
}
