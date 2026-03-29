import { Controller, Get, Put, Body } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

class UpdateLlmConfigDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  apiUrl?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  model?: string;
}

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get('llm')
  getLlmConfig() {
    return this.service.getLlmConfig();
  }

  @Put('llm')
  updateLlmConfig(@Body() dto: UpdateLlmConfigDto) {
    return this.service.updateLlmConfig(dto);
  }
}
