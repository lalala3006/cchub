import { IsInt, Max, Min } from 'class-validator';

export class UpdateFocusConfigDto {
  @IsInt()
  @Min(1)
  @Max(10)
  weight: number;
}
