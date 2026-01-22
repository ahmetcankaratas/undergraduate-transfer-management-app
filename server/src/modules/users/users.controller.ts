import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole } from '../../common/enums';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OIDB_STAFF)
  async findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('student')
  @Roles(UserRole.STUDENT)
  async updateStudentProfile(
    @CurrentUser() user: any,
    @Body() updateData: any,
  ) {
    return this.usersService.updateStudent(user.id, updateData);
  }

  @Patch('staff')
  @Roles(UserRole.OIDB_STAFF, UserRole.FACULTY_STAFF, UserRole.YGK_MEMBER)
  async updateStaffProfile(@CurrentUser() user: any, @Body() updateData: any) {
    return this.usersService.updateStaff(user.id, updateData);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }
}
