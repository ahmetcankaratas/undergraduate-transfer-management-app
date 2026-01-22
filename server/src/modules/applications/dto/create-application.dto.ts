import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  targetFaculty: string;

  @IsString()
  targetDepartment: string;

  @IsString()
  @IsOptional()
  applicationPeriod?: string;

  @IsNumber()
  @Min(0)
  @Max(4)
  declaredGpa: number;

  @IsNumber()
  @Min(0)
  declaredOsymScore: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  declaredOsymRank?: number;

  @IsNumber()
  @IsOptional()
  declaredOsymYear?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
