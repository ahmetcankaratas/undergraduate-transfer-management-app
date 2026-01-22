import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApplicationStatus } from '../../../common/enums';

export class FilterApplicationDto {
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsString()
  @IsOptional()
  targetFaculty?: string;

  @IsString()
  @IsOptional()
  targetDepartment?: string;

  @IsString()
  @IsOptional()
  applicationPeriod?: string;

  @IsString()
  @IsOptional()
  searchTerm?: string;
}
