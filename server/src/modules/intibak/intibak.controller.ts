import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IntibakService } from './intibak.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@Controller('intibak')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntibakController {
  constructor(private readonly intibakService: IntibakService) {}

  @Post('application/:appId')
  @Roles(UserRole.YGK_MEMBER, UserRole.ADMIN)
  createTable(@Param('appId') appId: string) {
    return this.intibakService.createIntibakTable(appId);
  }

  @Get('application/:appId')
  @Roles(UserRole.YGK_MEMBER, UserRole.ADMIN, UserRole.STUDENT, UserRole.OIDB_STAFF)
  getTable(@Param('appId') appId: string) {
    return this.intibakService.getIntibakTable(appId);
  }

  @Post(':tableId/equivalence')
  @Roles(UserRole.YGK_MEMBER, UserRole.ADMIN)
  addEquivalence(
    @Param('tableId') tableId: string,
    @Body()
    data: {
      sourceCourseId: string;
      targetCourseId: string;
      isMatch: boolean;
      notes?: string;
    },
  ) {
    return this.intibakService.addEquivalence(tableId, data);
  }

  @Delete('equivalence/:id')
  @Roles(UserRole.YGK_MEMBER, UserRole.ADMIN)
  removeEquivalence(@Param('id') id: string) {
    return this.intibakService.removeEquivalence(id);
  }

  @Post(':tableId/approve')
  @Roles(UserRole.YGK_MEMBER, UserRole.ADMIN)
  approveTable(@Param('tableId') tableId: string, @Req() req) {
    return this.intibakService.approveIntibakTable(tableId, req.user.userId);
  }

  // Development helper
  @Post('mock-courses/:studentId')
  @Roles(UserRole.ADMIN)
  createMockCourses(@Param('studentId') studentId: string) {
    return this.intibakService.createMockCourses(studentId);
  }
}
