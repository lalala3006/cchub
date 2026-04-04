import { Controller, Post, Body, Logger } from '@nestjs/common';
import { LlmService } from './llm.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('llm')
export class LlmController {
  private readonly logger = new Logger(LlmController.name);

  constructor(private readonly llmService: LlmService) {}

  @Post('chat')
  async chat(@Body() request: ChatRequestDto) {
    try {
      const reply = await this.llmService.chat(request.messages);
      return { reply };
    } catch (error) {
      this.logger.error('Chat failed', error);
      throw error;
    }
  }
}
