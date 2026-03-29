import { Module } from '@nestjs/common';
import { SystemConfigModule } from '../system-config/system-config.module';
import { LlmService } from './llm.service';

@Module({
  imports: [SystemConfigModule],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
