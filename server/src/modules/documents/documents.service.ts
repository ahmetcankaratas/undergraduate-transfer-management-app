import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, Application } from '../../entities';
import { DocumentType, ApplicationStatus } from '../../common/enums';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly uploadPath = process.env.UPLOAD_PATH || './uploads';

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async upload(
    applicationId: string,
    file: Express.Multer.File,
    type: DocumentType,
  ) {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only allow uploads for draft or submitted applications
    if (
      ![ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED].includes(
        application.status,
      )
    ) {
      throw new BadRequestException(
        'Cannot upload documents at this application stage',
      );
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadPath, fileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    const document = this.documentRepository.create({
      applicationId,
      type,
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: filePath,
    });

    return this.documentRepository.save(document);
  }

  async findByApplication(applicationId: string) {
    return this.documentRepository.find({
      where: { applicationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async verify(id: string, verifierId: string, notes?: string) {
    const document = await this.findOne(id);

    document.isVerified = true;
    document.verifiedAt = new Date();
    document.verifiedBy = verifierId;
    if (notes) {
      document.verificationNotes = notes;
    }

    return this.documentRepository.save(document);
  }

  async unverify(id: string) {
    const document = await this.findOne(id);

    document.isVerified = false;
    document.verifiedAt = null as any;
    document.verifiedBy = null as any;
    document.verificationNotes = null as any;

    return this.documentRepository.save(document);
  }

  async delete(id: string) {
    const document = await this.findOne(id);

    // Check if application allows deletion
    const application = await this.applicationRepository.findOne({
      where: { id: document.applicationId },
    });

    if (
      application &&
      ![ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED].includes(
        application.status,
      )
    ) {
      throw new BadRequestException(
        'Cannot delete documents at this application stage',
      );
    }

    // Delete file from disk
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    await this.documentRepository.remove(document);
    return { message: 'Document deleted successfully' };
  }

  async getFile(id: string): Promise<{ buffer: Buffer; document: Document }> {
    const document = await this.findOne(id);

    if (!fs.existsSync(document.path)) {
      throw new NotFoundException('File not found on disk');
    }

    const buffer = fs.readFileSync(document.path);
    return { buffer, document };
  }
}
