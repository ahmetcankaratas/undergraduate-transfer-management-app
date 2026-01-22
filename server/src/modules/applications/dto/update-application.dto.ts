import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApplicationStatus } from '../../../common/enums';

export class UpdateApplicationDto {
  @IsString()
  @IsOptional()
  targetFaculty?: string;

  @IsString()
  @IsOptional()
  targetDepartment?: string;

  @IsNumber()
  @Min(0)
  @Max(4)
  @IsOptional()
  declaredGpa?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  declaredOsymScore?: number;

  @IsNumber()
  @IsOptional()
  declaredOsymYear?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;
}
