import { IsString, IsInt, Min, Max } from 'class-validator';

export class CreateFocusConfigDto {
  @IsString()
  keyword: string;

  @IsInt()
  @Min(1)
  @Max(10)
  weight: number;
}