import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole, DocumentType } from '../../common/enums';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post(':applicationId')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('applicationId') applicationId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(pdf|doc|docx|jpg|jpeg|png)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('type') type: DocumentType,
  ) {
    return this.documentsService.upload(applicationId, file, type);
  }

  @Get('application/:applicationId')
  async findByApplication(@Param('applicationId') applicationId: string) {
    return this.documentsService.findByApplication(applicationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { buffer, document } = await this.documentsService.getFile(id);

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.originalName}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Post(':id/verify')
  @Roles(UserRole.OIDB_STAFF, UserRole.YGK_MEMBER)
  async verify(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.documentsService.verify(id, user.id, body.notes);
  }

  @Post(':id/unverify')
  @Roles(UserRole.OIDB_STAFF, UserRole.YGK_MEMBER)
  async unverify(@Param('id') id: string) {
    return this.documentsService.unverify(id);
  }

  @Delete(':id')
  @Roles(UserRole.STUDENT)
  async delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
